const screenshotDialog = document.querySelector('.screenshot-dialog');
if (screenshotDialog) {
  const enlargedImage = screenshotDialog.querySelector('img');
  const dialogTitle = screenshotDialog.querySelector('h2');

  document.querySelectorAll('[data-screenshot]').forEach(button => {
    button.addEventListener('click', () => {
      const thumbnail = button.querySelector('img');
      enlargedImage.src = thumbnail.src;
      enlargedImage.alt = thumbnail.alt;
      dialogTitle.textContent = button.getAttribute('aria-label').replace('Enlarge ', '');
      screenshotDialog.showModal();
    });
  });

  screenshotDialog.addEventListener('click', event => {
    if (event.target === screenshotDialog) screenshotDialog.close();
  });
}

const zipStory = document.querySelector('[data-zip-story]');
if (zipStory) {
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      zipStory.classList.add('is-playing');
      observer.disconnect();
    }
  }, { threshold: 0.18 });
  observer.observe(zipStory);
}
