module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "user",
    {
      name: DataTypes.STRING,
      password: DataTypes.STRING,
      email: DataTypes.STRING,
      isDoctor: DataTypes.BOOLEAN
    },
    {
      freezeTableName: true,
    }
  );
  return User;
};
