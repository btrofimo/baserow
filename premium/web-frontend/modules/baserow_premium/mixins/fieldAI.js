import { notifyIf } from '@baserow/modules/core/utils/error'

import FieldService from '@baserow_premium/services/field'
import { AI_FIELD_STATUS } from '@baserow_premium/constants'

export default {
  data() {
    return {
      localGenerating: false,
    }
  },
  computed: {
    workspace() {
      return this.$store.getters['workspace/get'](this.workspaceId)
    },
    generating() {
      // Check row metadata for generating status from websocket updates
      const metadata = this.row?._.metadata
      if (metadata && metadata.ai_field) {
        const fieldMetadata = metadata.ai_field[this.field.id]
        if (fieldMetadata?.status === AI_FIELD_STATUS.GENERATING) {
          return true
        }
      }
      // Combine with local state for immediate feedback when user clicks generate
      return this.localGenerating
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
  watch: {
    value() {
      // Clear local generating state when value updates
      this.localGenerating = false
    },
  },
  methods: {
    async generate() {
      this.localGenerating = true
      try {
        await FieldService(this.$client).generateAIFieldValues(this.field.id, [
          this.row.id,
        ])
      } catch (error) {
        notifyIf(error, 'field')
        this.localGenerating = false
      }
    },
  },
}
