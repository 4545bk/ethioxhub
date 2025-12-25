// Simple event system to trigger signup modal from anywhere
let signupModalListener = null;

export const triggerSignupModal = () => {
    if (signupModalListener) {
        signupModalListener();
    }
};

export const setSignupModalListener = (listener) => {
    signupModalListener = listener;
};
