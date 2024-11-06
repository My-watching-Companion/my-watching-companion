function toggleVisibility() {
  const visibility = document.getElementById("visibility");
  const password = document.getElementById("password");

  if (visibility.innerText.endsWith("_off")) {
    visibility.innerText = "visibility";
    password.attributes.getNamedItem("type").value = "text";
  } else {
    visibility.innerText = "visibility_off";
    password.attributes.getNamedItem("type").value = "password";
  }
}
