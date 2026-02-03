import { notifyIf } from '@baserow/modules/core/utils/error'

import FieldService from '@baserow_premium/services/field'

export default {
  computed: {
    workspace() {
      return this.$store.getters['workspace/get'](this.workspaceId)
    },
    generating() {
      const metadata = this.row?._?.metadata
      return (
        metadata?.ai_field?.[this.field.id]?.status === AI_FIELD_STATUS.GENERATING
      )
    },
    modelAvailable() {
      const aIModels =
        this.$store.getters['settings/get'].generative_ai[
          this.field.ai_generative_ai_type
        ] || []
      return (
        this.$registry
          .get('field', this.field.type)
          .isEnabled(this.workspace) &&
        aIModels.includes(this.field.ai_generative_ai_model)
      )
    },
    isDeactivated() {
      return this.$registry
        .get('field', this.field.type)
        .isDeactivated(this.workspaceId)
    },
    deactivatedClickComponent() {
      return this.$registry
        .get('field', this.field.type)
        .getDeactivatedClickModal(this.workspaceId)
    },
  },
  methods: {
    async generate() {
      if (this.isDeactivated) {
        this.$refs.clickModal.show()
        return
      }

      try {
        await this.$store.dispatch('rowModal/generateAIFieldValue', {
          fieldId: this.field.id,
          rowId: this.row.id,
          row: this.row,
          generateFn: (fieldId, rowId) =>
            FieldService(this.$client).generateAIFieldValues(fieldId, [rowId]),
        })
      } catch (error) {
        notifyIf(error, 'field')
      }
    },
  },
}
