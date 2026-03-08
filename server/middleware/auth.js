import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json("Token is not valid!");
            }
            req.user = { id: decoded.id, _id: decoded.id }; // Set both to be safe
            next();
        });
    } else {
        return res.status(401).json("You are not authenticated!");
    }
};

export default auth;
