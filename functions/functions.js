import bcrypt from "bcryptjs";

const EncryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const ComparePassword = async (password, hashPassword) => {
  return await bcrypt.compare(password, hashPassword);
};

export { EncryptPassword, ComparePassword };
