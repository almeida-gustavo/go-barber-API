import Sequelize, { Model } from 'sequelize';
import bcrypt from 'bcryptjs';

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL,
        password_hash: Sequelize.STRING,
        provider: Sequelize.BOOLEAN,
      },
      { sequelize }
    );

    this.addHook('beforeSave', async user => {
      if (user.password)
        user.password_hash = await bcrypt.hash(user.password, 8);
    });

    return this;
  }

  // Associação que vc ta criando por ter criado a associação do avatar_id (files) com o user
  // Existem outros tipos de relacionamentos alem desse belongs to, como hasOne, hasMany, belongsToMany etc
  static associate(models) {
    this.belongsTo(models.File, { foreignKey: 'avatar_id', as: 'avatar' });
  }

  // Metodos especificos da classe

  checkPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }
}

export default User;
