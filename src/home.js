const previousSections = {
  '#work': '#services',
  '#freelance': '#services',
  '#contact': 'contact.html',
  '#experience': 'about.html',
  '#reviews': 'reviews.html',
  '#upwork': 'about.html#upwork',
  '#community': 'about.html#community',
  '#hobbies': 'about.html#hobbies',
};
const previousSection = previousSections[window.location.hash];
if (previousSection) window.location.replace(previousSection);
