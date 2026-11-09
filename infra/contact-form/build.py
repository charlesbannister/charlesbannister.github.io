"""Writes template.yaml from template.in.yaml with handler.py inlined.
CloudFormation inline Lambda code is limited to 4096 bytes."""
from pathlib import Path

here = Path(__file__).parent
code = (here / "handler.py").read_text()
assert len(code.encode()) <= 4096, f"handler.py is {len(code.encode())} bytes; limit 4096"
inlined = "\n".join("          " + l if l else "" for l in code.splitlines())
(here / "template.yaml").write_text((here / "template.in.yaml").read_text().replace("{{HANDLER}}", inlined))
print("wrote template.yaml")
