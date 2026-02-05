import { notifyIf } from '@baserow/modules/core/utils/error'

import FieldService from '@baserow_premium/services/field'
import { AI_FIELD_STATUS } from '@baserow_premium/constants'

/**
 * Check if an AI field is currently generating for a given row.
 */
function checkIsGenerating(fieldId, row) {
  const metadata = row?._?.metadata
  return metadata?.ai_field?.[fieldId]?.status === AI_FIELD_STATUS.GENERATING
}

/**
 * Check if the AI model is available for a given field.
 */
function checkIsModelAvailable(store, registry, workspaceId, field) {
  const workspace = store.getters['workspace/get'](workspaceId)
  if (!workspace) return false

  const aIModels =
    workspace.generative_ai_models_enabled[field.ai_generative_ai_type] || []
  return (
    registry.get('field', field.type).isEnabled(workspace) &&
    aIModels.includes(field.ai_generative_ai_model)
  )
}

export default {
  computed: {
    generating() {
      return checkIsGenerating(this.field.id, this.row)
    },
    generationError() {
      const metadata = this.row?._ && this.row._.metadata
      if (metadata && metadata.ai_field) {
        const fieldMetadata = metadata.ai_field[this.field.id]
        if (fieldMetadata?.status === AI_FIELD_STATUS.ERROR) {
          return {
            message: this.$t('gridViewFieldAI.generationFailed'),
          }
        }
      }
      return null
    },
    metadataStatusIndicator() {
      const metadata = this.row?._ && this.row._.metadata
      if (metadata && metadata.ai_field) {
        const fieldMetadata = metadata.ai_field[this.field.id]
        if (fieldMetadata?.status === AI_FIELD_STATUS.ERROR) {
          return {
            icon: 'iconoir-warning-triangle',
            color: 'var(--color-warning)',
            message: this.$t('gridViewFieldAI.generationFailed'),
          }
        }
      }
      return null
    },
    modelAvailable() {
      return checkIsModelAvailable(
        this.$store,
        this.$registry,
        this.workspaceId,
        this.field
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
    workspace() {
      return this.$store.getters['workspace/get'](this.workspaceId)
    },
  },
  methods: {
    isGenerating(parent, props) {
      return checkIsGenerating(props.field.id, parent.row)
    },
    isModelAvailable(parent, props) {
      return checkIsModelAvailable(
        parent.$store,
        parent.$registry,
        props.workspaceId,
        props.field
      )
    },
    async generate() {
      if (this.isDeactivated) {
        this.$refs.clickModal.show()
        return
      }

      const rowId = this.row.id
      const row = this.row

      const previousMetadata =
        (row?._ && row._.metadata?.ai_field?.[this.field.id]) || null

      this.$store.commit(this.storePrefix + 'view/grid/UPDATE_ROW_METADATA', {
        row,
        metadata: {
          ai_field: {
            [this.field.id]: { status: AI_FIELD_STATUS.GENERATING },
          },
        },
      })

      try {
        await FieldService(this.$client).generateAIFieldValues(this.field.id, [
          rowId,
        ])
      } catch (error) {
        notifyIf(error, 'field')

        // Rollback metadata to previous state on error
        // If there was no previous metadata, clear it entirely
        this.$store.commit(this.storePrefix + 'view/grid/UPDATE_ROW_METADATA', {
          row,
          metadata: {
            ai_field: {
              [this.field.id]: previousMetadata,
            },
          },
        })
      }
    },
  },
}
