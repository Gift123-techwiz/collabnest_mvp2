const { EntitySchema } = require('typeorm');

// Join entity: users <-> skills. Composite primary key (user_id, skill_id).
module.exports = new EntitySchema({
  name: 'UserSkill',
  tableName: 'user_skills',
  columns: {
    userId: { type: 'uuid', primary: true, name: 'user_id' },
    skillId: { type: 'uuid', primary: true, name: 'skill_id' },
    createdAt: { type: 'timestamptz', createDate: true, name: 'created_at' },
  },
  relations: {
    user: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'user_id' },
      onDelete: 'CASCADE',
      inverseSide: 'skills',
    },
    skill: {
      target: 'Skill',
      type: 'many-to-one',
      joinColumn: { name: 'skill_id' },
      onDelete: 'CASCADE',
    },
  },
});
