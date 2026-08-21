const { EntitySchema } = require('typeorm');

// Join entity: project_roles <-> skills (required skills for a role).
module.exports = new EntitySchema({
  name: 'ProjectRoleSkill',
  tableName: 'project_role_skills',
  columns: {
    roleId: { type: 'uuid', primary: true, name: 'role_id' },
    skillId: { type: 'uuid', primary: true, name: 'skill_id' },
  },
  relations: {
    role: {
      target: 'ProjectRole',
      type: 'many-to-one',
      joinColumn: { name: 'role_id' },
      onDelete: 'CASCADE',
      inverseSide: 'requiredSkills',
    },
    skill: {
      target: 'Skill',
      type: 'many-to-one',
      joinColumn: { name: 'skill_id' },
      onDelete: 'CASCADE',
    },
  },
});
