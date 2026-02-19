import { loginAdmin } from "../services/adminAuth.service.js";

export async function loginAdminController(req, res) {
  const { email, password } = req.body;

  const result = await loginAdmin(email, password);

  if (!result) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json(result);
}
