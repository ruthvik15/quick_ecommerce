const bcrypt = require("bcrypt");
const { createtoken } = require("../utils/auth");

async function signup(createFn, data) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  return await createFn({
    ...data,
    password: hashedPassword,
  });
}
async function login(findFn, email, password) {
  const user = await findFn(email);

  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = createtoken(user);
  console.log(token);

  const { password: _, ...safeUser } = user;

  return { token, user: safeUser };
}
module.exports = {
  signup,
  login,
};