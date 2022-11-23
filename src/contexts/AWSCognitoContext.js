import PropTypes from 'prop-types';
import { createContext, useCallback, useEffect, useReducer } from 'react';
import { CognitoUser, CognitoUserPool, AuthenticationDetails } from 'amazon-cognito-identity-js';
// utils
import axios from '../axios';
// routes
// import { PATH_AUTH } from '../routes/paths';
//
// import { cognitoConfig } from '../config';

// ----------------------------------------------------------------------

// CAUTION: User Cognito is slily difference from firebase, so be sure to read the doc carefully.

export const UserPool = new CognitoUserPool({
  UserPoolId: 'ap-south-1_0dKNY19kv',
  ClientId: '1c5jeb5v52ui6avpldb9k2qqq4'
});

const initialState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null
};

const handlers = {
  AUTHENTICATE: (state, action) => {
    const { isAuthenticated, user } = action.payload;

    return {
      ...state,
      isAuthenticated,
      isInitialized: true,
      user
    };
  },
  LOGOUT: (state) => ({
    ...state,
    isAuthenticated: false,
    user: null
  })
};

const reducer = (state, action) => (handlers[action.type] ? handlers[action.type](state, action) : state);

const AuthContext = createContext({
  ...initialState,
  method: 'cognito',
  login: () => Promise.resolve(),
  register: () => Promise.resolve(),
  logout: () => Promise.resolve()
});

AuthProvider.propTypes = {
  children: PropTypes.node
};

function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getUserAttributes = useCallback(
    (currentUser) =>
      new Promise((resolve, reject) => {
        currentUser.getUserAttributes((err, attributes) => {
          if (err) {
            reject(err);
          } else {
            const results = {};

            attributes.forEach((attribute) => {
              results[attribute.Name] = attribute.Value;
            });
            resolve(results);
          }
        });
      }),
    []
  );

  const getSession = useCallback(
    () =>
      new Promise((resolve, reject) => {
        const user = UserPool.getCurrentUser();
        console.log(user)
        if (user) {
          user.getSession(async (err, session) => {
            if (err) {
              reject(err);
            } else {
              const attributes = await getUserAttributes(user);
              const token = session.getAccessToken().getJwtToken()
              if (token) {
                localStorage.getItem('accessToken', token)
                axios.defaults.headers.common.Authorization = `Bearer ${token}`
            } else {
                localStorage.removeItem('accessToken')
                delete axios.defaults.headers.common.Authorization
            }
              // use the token or Bearer depend on the wait BE handle, by default amplify API only need to token.
              console.log(token);
              axios.defaults.headers.common.Authorization = token;
              dispatch({
                type: 'AUTHENTICATE',
                payload: { isAuthenticated: true, user: attributes }
              });
              resolve({
                user,
                session,
                headers: { Authorization: token }
              });
            }
          });
        } else {
          dispatch({
            type: 'AUTHENTICATE',
            payload: {
              isAuthenticated: false,
              user: null
            }
          });
        }
      }),
    [getUserAttributes]
  );

  const initial = useCallback(async () => {
    try {
      await getSession();
    } catch {
      dispatch({
        type: 'AUTHENTICATE',
        payload: {
          isAuthenticated: false,
          user: null
        }
      });
    }
  }, [getSession]);

  useEffect(() => {
    initial();
  }, [initial]);

  // We make sure to handle the user update here, but return the resolve value in order for our components to be
  // able to chain additional `.then()` logic. Additionally, we `.catch` the error and "enhance it" by providing
  // a message that our React components can use.
  const login = useCallback(
    (email, password) =>
      new Promise((resolve, reject) => {
        const user = new CognitoUser({
          Username: email,
          Pool: UserPool
        });

        // console.log(user)
        const authDetails = new AuthenticationDetails({
          Username: email,
          Password: password
        });

        user.authenticateUser(authDetails, {
          onSuccess: (data) => {
            getSession();
            resolve(data);
          },
          onFailure: (err) => {
            reject(err);
          },
          newPasswordRequired: () => {
            // Handle this on login page for update password.
            resolve({ message: 'newPasswordRequired' });
          }
        });
      }),
    [getSession]
  );

  // same thing here
  const logout = () => {
    const user = UserPool.getCurrentUser();
    console.log('Logout')
    if (user) {
      user.signOut();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const register = (email, password, firstName, lastName) =>
    new Promise((resolve, reject) =>
      UserPool.signUp(
        email,
        password,
        [
          { Name: 'email', Value: email },
          { Name: 'name', Value: `${firstName} ${lastName}` }
        ],
        null,
        async (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      )
    );

  const resetPassword = () => {};

  return (
    <AuthContext.Provider
      value={{
        ...state,
        method: 'cognito',
        user: {
          displayName: state?.user?.name || 'Minimals',
          role: 'admin',
          ...state.user
        },
        login,
        register,
        logout,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };