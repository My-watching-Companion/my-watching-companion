function openSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.style.display = "flex";
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.style.display = "none";
}

function toggleVisibility(visibility, password_id) {
  const password = document.getElementById(password_id);

  if (visibility.innerText.endsWith("_off")) {
    visibility.innerText = "visibility";
    password.attributes.getNamedItem("type").value = "text";
  } else {
    visibility.innerText = "visibility_off";
    password.attributes.getNamedItem("type").value = "password";
  }
}
