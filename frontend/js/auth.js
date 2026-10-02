document.addEventListener('DOMContentLoaded', async () => {
  let isSignUpMode = false;
  let isResetMode = false;

  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const togglePassBtn = document.getElementById('togglePasswordBtn');
  const submitBtn = document.getElementById('btnLoginSubmit');
  const googleBtn = document.getElementById('btnGoogleAuth');
  const alertBox = document.getElementById('authAlert');
  const toggleModeLink = document.getElementById('toggleModeLink');
  const heading = document.querySelector('.auth-heading');
  const footerLabel = document.querySelector('.auth-card-footer span');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');

  // DOM Groups
  const groupEmail = document.getElementById('groupEmail');
  const groupPassword = document.getElementById('groupPassword');
  const groupAux = document.getElementById('groupAux');
  const groupDivider = document.getElementById('groupDivider');
  const groupGoogle = document.getElementById('groupGoogle');
  const groupFooter = document.getElementById('groupFooter');
  const passwordLabel = document.getElementById('passwordLabel');

  function getClient() {
    return window.supabaseClient || window.supabase || null;
  }

  function showAlert(msg, isError = true) {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `auth-alert ${isError ? 'error' : 'success'}`;
    alertBox.classList.remove('hidden');
  }

  function clearAlert() {
    if (!alertBox) return;
    alertBox.textContent = '';
    alertBox.classList.add('hidden');
  }

  // Production-safe URL navigation helper
  function getDashboardUrl() {
    return `${window.location.origin}/index.html`;
  }

  function getLoginUrl() {
    return `${window.location.origin}/login.html`;
  }

  const client = getClient();

  // 1. Password Recovery listener
  if (client && client.auth) {
    client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        isResetMode = true;

        if (heading) heading.textContent = 'Set New Password';
        if (submitBtn) {
          submitBtn.textContent = 'Update Password';
          submitBtn.style.display = 'block';
        }

        if (groupEmail) groupEmail.style.display = 'none';
        if (groupAux) groupAux.style.display = 'none';
        if (groupDivider) groupDivider.style.display = 'none';
        if (groupGoogle) groupGoogle.style.display = 'none';
        if (groupFooter) groupFooter.style.display = 'none';

        if (groupPassword) groupPassword.style.display = 'block';
        if (passwordLabel) passwordLabel.textContent = 'Enter New Password';

        if (emailInput) emailInput.removeAttribute('required');
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.placeholder = 'Enter at least 6 characters';
          passwordInput.focus();
        }

        showAlert('Enter your new password below.', false);
      }
    });

    // Auto-redirect to dashboard ONLY if user already has an active session and is NOT resetting
    const hash = window.location.hash || '';
    const isRecoveryHash = hash.includes('type=recovery');

    if (!isRecoveryHash) {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session) {
          window.location.replace(getDashboardUrl());
          return;
        }
      } catch (e) {
        console.warn('Session check bypassed:', e);
      }
    }
  }

  // 2. Password visibility toggle
  if (togglePassBtn && passwordInput) {
    togglePassBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    });
  }

  // 3. Switch between Login and Sign Up
  if (toggleModeLink) {
    toggleModeLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (isResetMode) return;
      clearAlert();

      isSignUpMode = !isSignUpMode;
      if (isSignUpMode) {
        if (heading) heading.textContent = 'Create Operator Account';
        if (submitBtn) submitBtn.textContent = 'Sign Up';
        if (footerLabel) footerLabel.textContent = 'Already have an account?';
        toggleModeLink.textContent = 'Login';
        if (groupAux) groupAux.style.display = 'none';
      } else {
        if (heading) heading.textContent = 'Operator Login';
        if (submitBtn) submitBtn.textContent = 'Login';
        if (footerLabel) footerLabel.textContent = 'Need an account?';
        toggleModeLink.textContent = 'Sign Up';
        if (groupAux) groupAux.style.display = 'block';
      }
    });
  }

  // 4. Handle Forgot Password link click
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
      e.preventDefault();
      clearAlert();

      const email = emailInput ? emailInput.value.trim() : '';
      if (!email) {
        showAlert('Please enter your email address in the field above first.');
        if (emailInput) emailInput.focus();
        return;
      }

      const activeClient = getClient();
      if (!activeClient || !activeClient.auth) {
        showAlert('Supabase client failed to initialize. Check your connection.');
        return;
      }

      try {
        showAlert('Sending password recovery email...', false);
        const { error } = await activeClient.auth.resetPasswordForEmail(email, {
          redirectTo: getLoginUrl()
        });

        if (error) throw error;
        showAlert('Password reset link sent! Check your inbox.', false);
      } catch (err) {
        showAlert(err.message || 'Error sending password reset email.');
      }
    });
  }

  // 5. Handle Form Submit (Handles Sign Up, Login, and Password Update)
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearAlert();

      const activeClient = getClient();
      if (!activeClient || !activeClient.auth) {
        showAlert('Supabase client failed to initialize.');
        return;
      }

      const password = passwordInput ? passwordInput.value : '';

      submitBtn.disabled = true;

      try {
        // CASE 1: Setting New Password after recovery link click
        if (isResetMode) {
          submitBtn.textContent = 'Updating...';
          const { error } = await activeClient.auth.updateUser({ password });
          if (error) throw error;

          showAlert('Password updated successfully! Redirecting to dashboard...', false);
          setTimeout(() => {
            window.location.replace(getDashboardUrl());
          }, 1200);
          return;
        }

        // CASE 2: Sign Up
        const email = emailInput ? emailInput.value.trim() : '';
        if (isSignUpMode) {
          submitBtn.textContent = 'Creating account...';
          const { data, error } = await activeClient.auth.signUp({ email, password });
          if (error) throw error;

          if (data?.session) {
            window.location.replace(getDashboardUrl());
          } else {
            showAlert('Account registered! Please check your email to confirm or sign in.', false);
          }
        } else {
          // CASE 3: Standard Login
          submitBtn.textContent = 'Authenticating...';
          const { data, error } = await activeClient.auth.signInWithPassword({ email, password });
          if (error) throw error;

          if (data?.session) {
            window.location.replace(getDashboardUrl());
          }
        }
      } catch (err) {
        showAlert(err.message || 'Authentication error.');
      } finally {
        submitBtn.disabled = false;
        if (!isResetMode) {
          submitBtn.textContent = isSignUpMode ? 'Sign Up' : 'Login';
        }
      }
    });
  }

  // 6. Handle Google OAuth
  if (googleBtn) {
    googleBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const activeClient = getClient();
      if (!activeClient || !activeClient.auth) {
        showAlert('Supabase client failed to initialize.');
        return;
      }

      try {
        googleBtn.disabled = true;
        const { error } = await activeClient.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: getDashboardUrl() }
        });
        if (error) throw error;
      } catch (err) {
        showAlert(err.message || 'Google Auth Error.');
        googleBtn.disabled = false;
      }
    });
  }
});