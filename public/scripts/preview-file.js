const previewFile = function () {
  let preview = document.getElementById('preview');
  let file = document.querySelector('input[type=file]').files[0];
  let reader = new FileReader();

  reader.addEventListener("load", function () {
    preview.src = reader.result;
  }, false);

  if (file) {
    reader.readAsDataURL(file);
  }
}
let image = document.getElementById('image');
image.addEventListener('load', previewFile);
image.onchange = previewFile;