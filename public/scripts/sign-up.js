async function loadSecurityQuestions() {
  let securityQuestions = await fetch("/api/securityquestions", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  securityQuestions = await securityQuestions.json();

  if (!securityQuestions.error) {
    const selectSecurityQuestions =
      document.getElementById("security-question");

    securityQuestions.questions.forEach((question) => {
      const option = document.createElement("option");
      option.value = question.SecurityQuestionID;
      option.innerHTML = question.SecurityQuestion;
      selectSecurityQuestions.appendChild(option);
    });
  }
}

loadSecurityQuestions();
