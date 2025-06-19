async function checkEmail() {
  const email = document.getElementById("email").value.trim();
  const errorBox = document.getElementById("error-box");

  let checkEmail = await fetch("/api/getsecurityquestion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  checkEmail = await checkEmail.json();

  if (checkEmail.error) {
    errorBox.innerHTML = checkEmail.error;
    errorBox.classList.remove("invisible");
    errorBox.classList.add("visible");
    return;
  }

  if (checkEmail.securityQuestion) {
    errorBox.classList.add("invisible");
    errorBox.classList.remove("visible");

    const label = document.querySelector("label[for='question']");
    label.innerHTML = `<b>${checkEmail.securityQuestion}</b>`;
    label.classList.toggle("invisible");
    label.classList.toggle("visible");

    const questionAnswer = document.getElementById("question");
    questionAnswer.classList.remove("invisible");
    questionAnswer.classList.add("visible");

    const confirmBtn = document.getElementById("confirm-button");
    confirmBtn.attributes.getNamedItem("onclick").value = "checkResponse()";
  }
}

async function checkResponse() {
  const email = document.getElementById("email").value.trim();
  const response = document.getElementById("question").value.trim();
  const errorBox = document.getElementById("error-box");

  let checkReponse = await fetch("/api/checksecurityanswer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, response }),
  });

  checkReponse = await checkReponse.json();

  if (checkReponse.error) {
    errorBox.innerHTML = checkReponse.error;
    errorBox.classList.remove("invisible");
    errorBox.classList.add("visible");
    return;
  }

  if (checkReponse.success) {
    errorBox.classList.add("invisible");
    errorBox.classList.remove("visible");

    const pwdLabel = document.querySelector("label[for='password']");
    pwdLabel.classList.remove("invisible");
    pwdLabel.classList.add("visible");

    const pwdCtn = document.getElementById("password-container");
    pwdCtn.classList.remove("invisible");
    pwdCtn.classList.add("visible");

    const confirmPwdLabel = document.querySelector(
      "label[for='confirm-password']"
    );
    confirmPwdLabel.classList.remove("invisible");
    confirmPwdLabel.classList.add("visible");

    const confirmPwdCtn = document.getElementById("confirm-password-container");
    confirmPwdCtn.classList.remove("invisible");
    confirmPwdCtn.classList.add("visible");

    const pwdNecessities = document.getElementById("password-necessities");
    pwdNecessities.classList.remove("invisible");
    pwdNecessities.classList.add("visible");

    const confirmBtn = document.getElementById("confirm-button");
    confirmBtn.attributes.getNamedItem("onclick").value = "changePassword()";
  }
}

async function changePassword() {
  const email = document.getElementById("email").value.trim();
  const response = document.getElementById("question").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const errorBox = document.getElementById("error-box");

  const { uppercase, number, special_character, length } =
    checkPasswordNecessities(password);

  const passwordNecessities = [
    uppercase,
    number,
    special_character,
    length,
    password == confirmPassword,
  ];

  if (passwordNecessities.some((p) => !p)) {
    errorBox.innerHTML =
      "Votre mot de passe ne répond pas aux critères de validation.";
    errorBox.classList.remove("invisible");
    errorBox.classList.add("visible");
    return;
  }

  let checkReponse = await fetch("/api/checksecurityanswer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, response }),
  });

  checkReponse = await checkReponse.json();

  if (checkReponse.error) {
    errorBox.innerHTML = checkReponse.error;
    errorBox.classList.remove("invisible");
    errorBox.classList.add("visible");
    return;
  }

  let changePwdResponse = await fetch("/api/changepassword", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, response, password }),
  });

  changePwdResponse = await changePwdResponse.json();

  if (changePwdResponse.error) {
    errorBox.innerHTML = changePwdResponse.error;
    errorBox.classList.remove("invisible");
    errorBox.classList.add("visible");
    return;
  }

  if (changePwdResponse.success) {
    const form = document.getElementById("forgotten-pwd-form");
    form.innerHTML = "";

    const successMessage = document.createElement("p");
    successMessage.style.textAlign = "center";
    successMessage.innerHTML =
      'Votre mot de passe a été <b>modifié</b>. Vous allez être redirigé vers la page de connexion, cliquez <b><a href="/signin">ici</a></b> autrement.';

    form.appendChild(successMessage);

    setTimeout(() => {
      window.location.href = "/signin";
    }, 3000);
  }
}

function checkPasswordNecessities(password) {
  const uppercaseRegex = /[A-Z]/;
  const numberRegex = /[0-9]/;
  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
  const lengthRegex = /^.{8,}$/;

  const uppercaseTest = uppercaseRegex.test(password);
  const numberTest = numberRegex.test(password);
  const specialCharTest = specialCharRegex.test(password);
  const lengthTest = lengthRegex.test(password);

  return {
    uppercase: uppercaseTest,
    number: numberTest,
    special_character: specialCharTest,
    length: lengthTest,
  };
}

async function displayPasswordNecessities(element) {
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const currentPassword = element.value;

  const uppercaseError = document.getElementById("uppercase-error");
  const numberError = document.getElementById("number-error");
  const specialCharError = document.getElementById("special-error");
  const lengthError = document.getElementById("length-error");
  const matchError = document.getElementById("match-error");

  const { uppercase, number, special_character, length } =
    checkPasswordNecessities(currentPassword);

  if (uppercase) {
    uppercaseError.classList.remove("unchecked");
    uppercaseError.classList.add("checked");
  } else {
    uppercaseError.classList.remove("checked");
    uppercaseError.classList.add("unchecked");
  }

  if (number) {
    numberError.classList.remove("unchecked");
    numberError.classList.add("checked");
  } else {
    numberError.classList.remove("checked");
    numberError.classList.add("unchecked");
  }

  if (special_character) {
    specialCharError.classList.remove("unchecked");
    specialCharError.classList.add("checked");
  } else {
    specialCharError.classList.remove("checked");
    specialCharError.classList.add("unchecked");
  }

  if (length) {
    lengthError.classList.remove("unchecked");
    lengthError.classList.add("checked");
  } else {
    lengthError.classList.remove("checked");
    lengthError.classList.add("unchecked");
  }

  if (password === confirmPassword) {
    matchError.classList.remove("unchecked");
    matchError.classList.add("checked");
  } else {
    matchError.classList.remove("checked");
    matchError.classList.add("unchecked");
  }

  const passwordStrength = [
    uppercase,
    number,
    special_character,
    length,
  ].filter((p) => p).length;

  const passwordStrengthElement = document.getElementById("password-strength");

  if (passwordStrength < 2) {
    passwordStrengthElement.classList.remove("average", "strong");
    passwordStrengthElement.classList.add("weak");
    passwordStrengthElement.innerText = "faible";
  } else if (passwordStrength < 4) {
    passwordStrengthElement.classList.remove("weak", "strong");
    passwordStrengthElement.classList.add("average");
    passwordStrengthElement.innerText = "moyen";
  } else {
    passwordStrengthElement.classList.remove("weak", "average");
    passwordStrengthElement.classList.add("strong");
    passwordStrengthElement.innerText = "fort";
  }
}
