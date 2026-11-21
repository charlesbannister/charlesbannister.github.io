#!/usr/bin/env python3
"""Regenerate the static food catalog or inspect public recipe metadata."""

import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import time
from urllib.error import URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener
from urllib.robotparser import RobotFileParser


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "tools/food-a-la-carte.json"
POPULAR_DATA = ROOT / "tools/food-popular-picks.json"
OUTPUT = ROOT / "src/food/a-la-carte.js"
POPULAR_OUTPUT = ROOT / "src/food/popular-meals.js"
AGENT = "CharlesBannisterFoodRecipeIndex/1.0 (+https://charlesbannister.com/food/)"
CATEGORIES = ("Sides", "Standalone mains", "Starters", "Snacks")
MEAL_CATEGORIES = ("Breakfast", "Quick lunch", "Pasta & grains", "Soup & comfort", "Wraps & burgers", "Seafood")
SOURCE_URLS = {
    "BBC Food": r"https://www\.bbc\.co\.uk/food/recipes/[a-z0-9_]+",
    "Good Food": r"https://www\.bbcgoodfood\.com/recipes/[a-z0-9-]+",
    "RecipeTin Eats": r"https://www\.recipetineats\.com/[a-z0-9-]+/",
    "Budget Bytes": r"https://www\.budgetbytes\.com/[a-z0-9-]+/",
    "King Arthur Baking": r"https://www\.kingarthurbaking\.com/recipes/[a-z0-9-]+",
}
INDEXABLE_ORIGINS = {
    "Good Food": "https://www.bbcgoodfood.com",
    "RecipeTin Eats": "https://www.recipetineats.com",
}


def allowed_source(name, url):
    return name in SOURCE_URLS and re.fullmatch(SOURCE_URLS[name], url) is not None


def well_reviewed(source):
    rating = source.get("rating")
    count = source.get("ratingCount")
    return type(rating) in (int, float) and 4.7 <= rating <= 5 and type(count) is int and count >= 100


def rating_fields(aggregate):
    if not isinstance(aggregate, dict):
        return {}
    try:
        value = float(aggregate["ratingValue"])
        best = float(aggregate.get("bestRating", 5))
        count = float(aggregate.get("ratingCount", aggregate.get("reviewCount")))
    except (KeyError, TypeError, ValueError):
        return {}
    if best != 5 or not 0 <= value <= 5 or not count.is_integer() or count < 1:
        return {}
    return {"rating": value, "ratingCount": int(count)}


class StructuredData(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.collecting = False

    def handle_starttag(self, tag, attributes):
        if tag == "script" and dict(attributes).get("type") == "application/ld+json":
            self.collecting = True
            self.scripts.append([])

    def handle_data(self, data):
        if self.collecting:
            self.scripts[-1].append(data)

    def handle_endtag(self, tag):
        if tag == "script":
            self.collecting = False


def recipe_objects(value):
    if isinstance(value, list):
        for child in value:
            yield from recipe_objects(child)
    elif isinstance(value, dict):
        types = value.get("@type")
        if types == "Recipe" or isinstance(types, list) and "Recipe" in types:
            yield value
        yield from recipe_objects(value.get("@graph"))


def recipe_metadata(html):
    parser = StructuredData()
    parser.feed(html)
    for script in parser.scripts:
        try:
            structured = json.loads("".join(script))
        except json.JSONDecodeError:
            continue
        for recipe in recipe_objects(structured):
            if not isinstance(recipe.get("name"), str) or not recipe["name"].strip():
                continue
            author = recipe.get("author")
            if isinstance(author, list):
                author = next(iter(author), None)
            if isinstance(author, dict):
                author = author.get("name")
            fields = {"title": recipe["name"], "author": author, "totalTime": recipe.get("totalTime")}
            metadata = {field: value.strip() for field, value in fields.items() if isinstance(value, str) and value.strip()}
            return {**metadata, **rating_fields(recipe.get("aggregateRating"))}
    raise ValueError("No public Recipe structured data found")


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, file, code, message, headers, newurl):
        return None


def read_public_page(opener, url, limit):
    request = Request(url, headers={"User-Agent": AGENT})
    with opener.open(request, timeout=15) as response:
        content = response.read(limit + 1)
        if len(content) > limit:
            raise ValueError(f"Page exceeded {limit} bytes")
        return content.decode(response.headers.get_content_charset() or "utf-8")


def check_sources(name, urls):
    if len(urls) > 25 or any(not allowed_source(name, url) for url in urls):
        raise ValueError("Use up to 25 public recipe URLs for the selected source")
    opener = build_opener(NoRedirects())
    robots = RobotFileParser()
    robots.parse(read_public_page(opener, INDEXABLE_ORIGINS[name] + "/robots.txt", 256_000).splitlines())
    delay = max(1, robots.crawl_delay(AGENT) or 0)
    results = []
    for url in urls:
        if not robots.can_fetch(AGENT, url):
            results.append({"url": url, "error": "Disallowed by robots.txt"})
            continue
        time.sleep(delay)
        try:
            metadata = recipe_metadata(read_public_page(opener, url, 4_000_000))
            results.append({"url": url, **metadata})
        except (URLError, TimeoutError, ValueError) as error:
            results.append({"url": url, "error": str(error)})
    print(json.dumps(results, ensure_ascii=False, indent=2))
    return int(any("error" in result for result in results))


def validate_items(items, categories):
    titles = set()
    for item in items:
        for field in ("title", "ingredients", "method"):
            if not isinstance(item.get(field), str) or not item[field].strip():
                raise ValueError(f"Missing {field} in a catalog entry")
        if item.get("category") not in categories or type(item.get("minutes")) is not int or item["minutes"] < 1:
            raise ValueError(f"Invalid category or time for {item['title']}")
        title = item["title"].strip().casefold()
        if title in titles:
            raise ValueError(f"Duplicate recipe title: {item['title']}")
        titles.add(title)
        source = item.get("source")
        if source is not None and not allowed_source(source.get("name"), source.get("url", "")):
            raise ValueError(f"Unsupported source URL for {item['title']}")


def load_array(path):
    items = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(items, list) or any(not isinstance(item, dict) for item in items):
        raise ValueError(f"Expected an array of objects in {path.name}")
    return items


def load_catalog():
    items = load_array(DATA)
    meals = []
    for pick in load_array(POPULAR_DATA):
        section = pick.pop("section", None)
        if not well_reviewed(pick.get("source", {})):
            raise ValueError(f"Recipe falls below 4.7/5 from 100 ratings: {pick.get('title')}")
        if section == "meals" and isinstance(pick.get("dinner"), bool):
            meals.append(pick)
        elif section == "a-la-carte":
            items.append(pick)
        else:
            raise ValueError(f"Invalid section or dinner status for {pick.get('title')}")
    validate_items(items, CATEGORIES)
    validate_items(meals, MEAL_CATEGORIES)
    return items, meals


def write_module(path, name, items, check):
    lines = [json.dumps(item, ensure_ascii=False, separators=(",", ":")) for item in items]
    module = f"// Generated by python3 tools/update-food-catalog.py\nexport const {name} = [\n"
    module += "".join(f"  {line},\n" for line in lines) + "];\n"
    if check:
        if not path.exists() or path.read_text(encoding="utf-8") != module:
            raise ValueError(f"{path.name} is stale. Run python3 tools/update-food-catalog.py.")
    else:
        path.write_text(module, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--check", action="store_true", help="check that the offline catalog is up to date")
    modes.add_argument("--check-good-food", action="store_true", help="check listed Good Food links")
    modes.add_argument("--check-source", choices=INDEXABLE_ORIGINS, help="read rating, vote count, and other factual metadata")
    parser.add_argument("--url", action="append", help="candidate recipe URL to check; repeat to check a batch")
    options = parser.parse_args()
    try:
        items, meals = load_catalog()
        source_name = "Good Food" if options.check_good_food else options.check_source
        if source_name:
            urls = options.url or [
                item["source"]["url"] for item in items + meals
                if (item.get("source") or {}).get("name") == source_name
            ]
            return check_sources(source_name, sorted(set(urls)))
        if options.url:
            parser.error("--url requires --check-source")
        write_module(OUTPUT, "items", items, options.check)
        write_module(POPULAR_OUTPUT, "popularMeals", meals, options.check)
    except (OSError, ValueError) as error:
        print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
