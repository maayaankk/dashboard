import { useContext } from 'react'
// import {AuthContext} from '../contexts/AwsCognitoContext'
import {AuthContext} from 'contexts/AWSCognitoContext';

const useAuth = () => useContext(AuthContext)

export default useAuth
