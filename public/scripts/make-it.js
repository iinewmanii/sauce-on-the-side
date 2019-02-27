const makeIt = () => {
  let bannedWords = document.getElementById('banned-words').textContent;
  bannedWords = bannedWords.split(',');
  document.getElementById('make-it-btn').addEventListener('click', () => {
    let articleBody = document.getElementById('article-body');
    let originalBodyText = articleBody.textContent;
    let form = document.getElementById('make-it-form');
    let inputs = document.getElementsByName('make-it-input');
    function styleInvalid(event) {
      event.target.classList.toggle('is-valid', false);
      event.target.classList.toggle('is-invalid', true);
    }
    articleBody.style.display = 'none';
    form.style.display = 'block';
    inputs.forEach((element) => {
      let invalidFeedback = element.nextElementSibling.nextElementSibling;
      const validate = (event) => {
        if (bannedWords.includes(event.target.value)) {
          let errMsg = 'That word is not allowed.';
          event.target.setCustomValidity(errMsg);
          element.setAttribute('title', errMsg);
          invalidFeedback.textContent = errMsg;
          styleInvalid(event);
        } else {
          event.target.setCustomValidity('');
          element.setAttribute('title', 'Upper or lower case letters a-z. Minimum of one character. Maximum of ten characters.');
        }
        event.target.checkValidity();
        if (event.target.validity.valid) {
          event.target.classList.toggle('is-valid', true);
          event.target.classList.toggle('is-invalid', false);
        } else if (event.target.validity.patternMismatch) {
          invalidFeedback.textContent = 'Upper or lower case letters a-z. Minimum of one character. Maximum of ten characters.';
          styleInvalid(event);
        } else if (event.target.validity.valueMissing) {
          invalidFeedback.textContent = 'Cannot be left blank.';
          styleInvalid(event);
        }
        let inputsPass = true;
        for (let i = 0; i < inputs.length; i++) {
          if (inputs[i].checkValidity()) continue;
          inputsPass = false;
          break;
        }
        if (inputsPass) {
          document.getElementById('make-it-submit').disabled = false;
        }
      }
      element.oninput = validate;
    });
    document.getElementById('make-it-back').addEventListener('click', (event) => {
      form.style.display = 'none';
      articleBody.style.display = 'block';
    }, false)
    document.getElementById('make-it-submit').addEventListener('click', (event) => {
      let values = [];
      let userValues = [];
      let userBodyText = originalBodyText.slice();
      inputs.forEach((element) => {
        let placeholder = element.getAttribute('placeholder');
        values.push(placeholder);
        let userVal = element.value;
        userValues.push(userVal);
      })
      for (let i = 0; i < values.length; i++) {
        console.log(values[i]);
        let regex = new RegExp('[^]' + values[i], 'gim');
        userBodyText = userBodyText.replace(regex, ' ' + userValues[i]);
      }
      articleBody.textContent = userBodyText;
      articleBody.style.display = 'block';
      form.style.display = 'none';
    }, false);
  }, false);
}

window.onload = makeIt;