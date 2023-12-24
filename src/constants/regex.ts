const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;

// ============ functions ============
export const isEmailValid = (email: string) => {
  return EMAIL_REGEX.test(email);
};

export const isUsernameValid = (username: string) => {
  return USERNAME_REGEX.test(username);
};
