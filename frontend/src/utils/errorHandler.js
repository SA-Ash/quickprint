
export const handleApiError = (error) => {
  if (error.response) {

    const { status, data } = error.response;

    switch (status) {
      case 400:
        return {
          type: 'validation',
          message: data.error || 'Invalid request data',
          details: data.errors || null,
        };
      case 401:
        return {
          type: 'auth',
          message: 'Authentication required',
          details: null,
        };
      case 403:
        return {
          type: 'permission',
          message: 'You do not have permission to perform this action',
          details: null,
        };
      case 404:
        return {
          type: 'not_found',
          message: 'Resource not found',
          details: null,
        };
      case 500:
        return {
          type: 'server',
          message: 'Internal server error. Please try again later.',
          details: null,
        };
      default:
        return {
          type: 'unknown',
          message: data.error || 'An unexpected error occurred',
          details: null,
        };
    }
  } else if (error.request) {

    return {
      type: 'network',
      message: 'Unable to connect to server. Please check your internet connection.',
      details: null,
    };
  } else {

    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred',
      details: null,
    };
  }
};

export const showError = (error) => {
  const errorInfo = handleApiError(error);
  console.error('API Error:', errorInfo);

  alert(errorInfo.message);
};

export const showSuccess = (message) => {
  console.log('Success:', message);

  alert(message);
};
