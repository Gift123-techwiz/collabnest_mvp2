const { EntitySchema } = require('typeorm');

// Join entity: projects <-> skills (used as "technologies" tags on a project).
module.exports = new EntitySchema({
  name: 'ProjectTechnology',
  tableName: 'project_technologies',
  columns: {
    projectId: { type: 'uuid', primary: true, name: 'project_id' },
    skillId: { type: 'uuid', primary: true, name: 'skill_id' },
  },
  relations: {
    project: {
      target: 'Project',
      type: 'many-to-one',
      joinColumn: { name: 'project_id' },
      onDelete: 'CASCADE',
      inverseSide: 'technologies',
    },
    skill: {
      target: 'Skill',
      type: 'many-to-one',
      joinColumn: { name: 'skill_id' },
      onDelete: 'CASCADE',
    },
  },
});
