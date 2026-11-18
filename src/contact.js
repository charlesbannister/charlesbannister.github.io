const form = document.querySelector('[data-contact]');
const fields = form.querySelector('[data-contact-fields]');
const button = form.querySelector('button[type="submit"]');
const error = form.querySelector('.contact-error');
const confirmation = form.querySelector('.contact-confirmation');
const started = performance.now();
const label = button.textContent;
const fallback = 'Sorry, that didn’t send. Please try again in a minute.';

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (button.disabled || !form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  const message = data.message.trim();
  if (!message) {
    error.textContent = 'Please tell me what you’d like to improve.';
    error.hidden = false;
    form.elements.message.focus();
    return;
  }

  button.disabled = true;
  button.textContent = 'Sending…';
  error.hidden = true;
  data.message = 'Enquiry: ' + data.service + '\n\n' + message;
  delete data.service;

  try {
    const remaining = 3100 - (performance.now() - started);
    if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
    data.elapsed_ms = Math.round(performance.now() - started);
    const response = await fetch(form.dataset.endpoint, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok && result.ok) {
      fields.hidden = true;
      confirmation.hidden = false;
      confirmation.focus();
    } else {
      error.textContent = result.error || fallback;
      error.hidden = false;
    }
  } catch {
    error.textContent = fallback;
    error.hidden = false;
  } finally {
    button.textContent = label;
    button.disabled = false;
  }
});
button.disabled = false;
