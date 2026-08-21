const { EntitySchema } = require('typeorm');
const { PAYMENT_EVENT_TYPES } = require('../utils/constants');

// Append-only audit log of every payment lifecycle event, per the security
// doc's Module 11 requirement ("Log every payment event — initiated,
// succeeded, failed, refunded — in an append-only audit table"). Nothing
// ever updates or deletes a row here; a new event is always a new row.
module.exports = new EntitySchema({
  name: 'PaymentEvent',
  tableName: 'payment_events',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    projectId: { type: 'uuid', name: 'project_id' },
    initiatedBy: { type: 'uuid', name: 'initiated_by' },
    plan: { type: 'varchar' },
    months: { type: 'int' },
    amountNaira: { type: 'int', name: 'amount_naira' },
    eventType: { type: 'enum', enum: PAYMENT_EVENT_TYPES, name: 'event_type' },
    paystackReference: { type: 'varchar', nullable: true, name: 'paystack_reference' },
    // Raw gateway payload for later dispute investigation — never contains
    // card numbers or CVVs; Paystack itself never sends us those.
    gatewayPayload: { type: 'text', nullable: true, name: 'gateway_payload' },
    createdAt: { type: 'timestamptz', createDate: true, name: 'created_at' },
  },
  indices: [
    { name: 'idx_payment_events_project', columns: ['projectId'] },
    { name: 'idx_payment_events_reference', columns: ['paystackReference'] },
  ],
});
