const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body

        // Input validation
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password"
            })
        }

        // Check if user already exists to prevent duplicate registrations
        const isUserAlreadyExists = await userModel.findOne({
            $or: [ { username }, { email } ]
        })

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "Account already exists with this email address or username"
            })
        }

        // Hash password for security
        const hash = await bcrypt.hash(password, 10)

        // Create new user in MongoDB
        const user = await userModel.create({
            username,
            email,
            password: hash
        })

        // Generate JWT token for immediate login after registration
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        // Set secure cookie with token
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        })

        // Return success response
        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })

    } catch (err) {
        console.error("Registration error:", err)
        return res.status(500).json({
            message: "An error occurred during registration. Please try again."
        })
    }
}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide both email and password"
            })
        }

        // Find user by email in MongoDB
        const user = await userModel.findOne({ email })

        // Return error if user not found (user must be registered first)
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            })
        }

        // Compare hashed password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password)

        // Return error if password is incorrect
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            })
        }

        // Generate JWT token on successful authentication
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        // Set secure cookie with token
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        })

        // Return success response
        return res.status(200).json({
            message: "User logged in successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })

    } catch (err) {
        console.error("Login error:", err)
        return res.status(500).json({
            message: "An error occurred during login. Please try again."
        })
    }
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    try {
        const token = req.cookies.token

        // Add token to blacklist if it exists
        if (token) {
            await tokenBlacklistModel.create({ token })
        }

        // Clear the token cookie
        res.clearCookie("token")

        return res.status(200).json({
            message: "User logged out successfully"
        })

    } catch (err) {
        console.error("Logout error:", err)
        return res.status(500).json({
            message: "An error occurred during logout. Please try again."
        })
    }
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {
    try {
        // Get user ID from decoded JWT token (set by auth middleware)
        const user = await userModel.findById(req.user.id)

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        return res.status(200).json({
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })

    } catch (err) {
        console.error("Get user error:", err)
        return res.status(500).json({
            message: "An error occurred while fetching user details. Please try again."
        })
    }
}



module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}