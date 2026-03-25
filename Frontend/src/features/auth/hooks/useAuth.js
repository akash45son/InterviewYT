import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";



export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context


    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
            if (data?.token) {
                localStorage.setItem("token", data.token)
            }
            return true
        } catch (err) {
            return false
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
            if (data?.token) {
                localStorage.setItem("token", data.token)
            }
            return true
        } catch (err) {
            return false
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
            localStorage.removeItem("token")
            return true
        } catch (err) {
            return false
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {

        const getAndSetUser = async () => {
            const token = localStorage.getItem("token")

            if (!token) {
                setUser(null)
                setLoading(false)
                return
            }

            try {

                const data = await getMe()
                setUser(data.user)
            } catch (err) {
                setUser(null)
                localStorage.removeItem("token")
            } finally {
                setLoading(false)
            }
        }

        getAndSetUser()

    }, [])

    return { user, loading, handleRegister, handleLogin, handleLogout }
}