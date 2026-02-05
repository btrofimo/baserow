import bufferedRows from '@baserow/modules/database/store/view/bufferedRows'
import GalleryService from '@baserow/modules/database/services/view/gallery'
import {
  getRowMetadata,
  mergeRowMetadata,
} from '@baserow/modules/database/utils/row'

export function populateRow(row, metadata = {}) {
  row._ = {
    metadata: getRowMetadata(row, metadata),
    dragging: false,
  }
  return row
}

const galleryBufferedRows = bufferedRows({
  service: GalleryService,
  customPopulateRow: populateRow,
})

export const state = () => ({
  ...galleryBufferedRows.state(),
})

export const mutations = {
  ...galleryBufferedRows.mutations,
  /**
   * Updates row metadata in the gallery buffer.
   * Deep merges new metadata with existing metadata, removing keys with null values.
   */
  UPDATE_ROW_METADATA(state, { row, metadata }) {
    const index = state.rows.findIndex((item) => item && item.id === row.id)
    if (index !== -1) {
      const existingRowState = state.rows[index]
      const existingMetadata = existingRowState._?.metadata || {}
      const mergedMetadata = mergeRowMetadata(existingMetadata, metadata)

      if (!existingRowState._) {
        populateRow(existingRowState, mergedMetadata)
      } else {
        existingRowState._ = {
          ...existingRowState._,
          metadata: mergedMetadata,
        }
      }
    }
  },
  /**
   * Replaces row metadata in the gallery buffer with the provided metadata.
   * Used when rows_metadata_updated provides complete metadata state.
   */
  REPLACE_ROW_METADATA(state, { row, metadata }) {
    const index = state.rows.findIndex((item) => item && item.id === row.id)
    if (index !== -1) {
      const existingRowState = state.rows[index]
      if (!existingRowState._) {
        populateRow(existingRowState, metadata)
      } else {
        existingRowState._ = {
          ...existingRowState._,
          metadata,
        }
      }
    }
  },
}

export const actions = {
  ...galleryBufferedRows.actions,
  async fetchInitial(
    { dispatch },
    { viewId, fields, adhocFiltering, adhocSorting }
  ) {
    const data = await dispatch('fetchInitialRows', {
      viewId,
      fields,
      initialRowArguments: { includeFieldOptions: true },
      adhocFiltering,
      adhocSorting,
    })
    await dispatch('forceUpdateAllFieldOptions', data.field_options)
  },
  /**
   * Updates row metadata for specific rows without changing row values.
   * Called when a rows_metadata_updated websocket event is received.
   */
  /**
   * Replaces row metadata for specific rows without changing row values.
   * Called when a rows_metadata_updated websocket event is received.
   * Uses replace (not merge) semantics because the backend regenerates
   * complete metadata from all registry types for the affected rows.
   */
  updateRowMetadata({ commit, getters }, { rowIds, metadata }) {
    const allRows = getters.getRows
    rowIds.forEach((rowId) => {
      const row = allRows.find((r) => r && r.id === rowId)
      if (row) {
        const rowMetadata = metadata[rowId] || {}
        commit('REPLACE_ROW_METADATA', { row, metadata: rowMetadata })
      }
    })
  },
}

export const getters = {
  ...galleryBufferedRows.getters,
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
