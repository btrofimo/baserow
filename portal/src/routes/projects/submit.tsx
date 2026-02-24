import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { submitProject } from '../../api/projects.functions'
import { AddressAutocomplete } from '../../components/AddressAutocomplete'
import type { GeocodingResult } from '../../lib/geocoding.server'

export const Route = createFileRoute('/projects/submit')({
  component: SubmitProjectPage,
})

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

const REQUEST_TYPES = [
  'Survey',
  'Inspection',
  'Appraisal',
  'Environmental',
  'Engineering',
  'Title Search',
]

const PRIORITIES = ['Low', 'Medium', 'High']

function SubmitProjectPage() {
  const { isAuthenticated, idToken } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  const form = useForm({
    defaultValues: {
      street: '',
      city: '',
      state: '',
      fileNo: '',
      requestType: [] as string[],
      priority: '',
      notes: '',
      latitude: undefined as number | undefined,
      longitude: undefined as number | undefined,
    },
    onSubmit: async ({ value }) => {
      setSubmitError('')
      try {
        await submitProject({
          data: {
            idToken: idToken!,
            fields: {
              ...value,
              priority: value.priority as 'Low' | 'Medium' | 'High',
            },
          },
        })
        navigate({ to: '/projects' })
      } catch {
        setSubmitError('Failed to submit project. Please try again.')
      }
    },
  })

  function handleAddressSelect(result: GeocodingResult) {
    form.setFieldValue('street', result.street)
    form.setFieldValue('city', result.city)
    form.setFieldValue('state', result.state)
    form.setFieldValue('latitude', result.latitude)
    form.setFieldValue('longitude', result.longitude)
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Submit New Project</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="bg-white shadow rounded-lg p-6 space-y-6"
        >
          {submitError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Address
            </label>
            <AddressAutocomplete
              onSelect={handleAddressSelect}
              placeholder="Type an address to search (e.g., 100 N Riverside Plaza, Chicago)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form.Field
              name="street"
              validators={{ onChange: ({ value }) => !value ? 'Street is required' : undefined }}
            >
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="123 Main St"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-xs mt-1">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="city"
              validators={{ onChange: ({ value }) => !value ? 'City is required' : undefined }}
            >
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-xs mt-1">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="state"
              validators={{ onChange: ({ value }) => !value ? 'State is required' : undefined }}
            >
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-xs mt-1">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="fileNo">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Number
                  </label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
            </form.Field>

            <form.Field
              name="priority"
              validators={{ onChange: ({ value }) => !value ? 'Priority is required' : undefined }}
            >
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select priority</option>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-xs mt-1">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="requestType">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Request Type
                  </label>
                  <div className="space-y-2">
                    {REQUEST_TYPES.map((type) => (
                      <label key={type} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={field.state.value.includes(type)}
                          onChange={(e) => {
                            const current = field.state.value
                            field.handleChange(
                              e.target.checked
                                ? [...current, type]
                                : current.filter((t) => t !== type)
                            )
                          }}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="notes">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Any additional details..."
                />
              </div>
            )}
          </form.Field>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={form.state.isSubmitting}
              className="px-6 py-2 bg-[#dc4b1a] text-white rounded-lg text-sm font-medium hover:bg-[#c54318] transition-colors disabled:opacity-50"
            >
              {form.state.isSubmitting ? 'Submitting...' : 'Submit Project'}
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: '/projects' })}
              className="px-6 py-2 border text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
