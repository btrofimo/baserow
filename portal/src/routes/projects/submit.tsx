import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { submitProject } from '../../api/projects.functions'
import { AddressAutocomplete } from '../../components/AddressAutocomplete'
import { AppLayout } from '../../components/layout/AppLayout'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
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
  'Engineering Report',
  'Estimate',
  'Weather Analysis',
  'Roof Report',
  'Photo Report',
  'Thermal Mapping',
  'Moisture Mapping',
  'Bid',
  'General Document',
  'Survey',
  'Inspection',
  'Measurements',
  'Research',
]

const PRIORITIES = ['Low', 'Normal', 'Medium', 'High']

function SubmitProjectPage() {
  const { isAuthenticated, idToken } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/auth/login' })
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
      claimNo: '',
      dol: '',
      ownerCompany: '',
      owner: '',
      access: '',
      accessRequested: '',
      additionalComments: '',
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
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          Submit New Project
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Fill in the project details below.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <Card>
          {submitError && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {submitError}
            </div>
          )}

          {/* Address Search */}
          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Search Address
            </label>
            <AddressAutocomplete
              onSelect={handleAddressSelect}
              placeholder="Type an address to search (e.g., 100 N Riverside Plaza, Chicago)"
            />
          </div>

          {/* Address Fields */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <form.Field
              name="street"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'Street is required' : undefined,
              }}
            >
              {(field) => (
                <Input
                  id="street"
                  label="Street Address *"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="123 Main St"
                  error={
                    field.state.meta.errors.length > 0
                      ? String(field.state.meta.errors[0])
                      : undefined
                  }
                />
              )}
            </form.Field>

            <form.Field
              name="city"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'City is required' : undefined,
              }}
            >
              {(field) => (
                <Input
                  id="city"
                  label="City *"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  error={
                    field.state.meta.errors.length > 0
                      ? String(field.state.meta.errors[0])
                      : undefined
                  }
                />
              )}
            </form.Field>

            <form.Field
              name="state"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'State is required' : undefined,
              }}
            >
              {(field) => (
                <Select
                  label="State *"
                  options={US_STATES.map((s) => ({ value: s, label: s }))}
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  placeholder="Select state"
                  searchable
                />
              )}
            </form.Field>
          </div>

          {/* Claim / File / DOL */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <form.Field name="claimNo">
              {(field) => (
                <Input
                  id="claimNo"
                  label="Claim No"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>

            <form.Field name="fileNo">
              {(field) => (
                <Input
                  id="fileNo"
                  label="File Number"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>

            <form.Field name="dol">
              {(field) => (
                <Input
                  id="dol"
                  label="Date of Loss"
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>
          </div>

          {/* Request Type — checkbox grid */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Request Type
            </label>
            <form.Field name="requestType">
              {(field) => (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {REQUEST_TYPES.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary cursor-pointer hover:border-border-focus transition-colors"
                    >
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
                        className="h-4 w-4 rounded border-border-default bg-bg-tertiary accent-accent-orange"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          {/* Owner fields */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <form.Field name="ownerCompany">
              {(field) => (
                <Input
                  id="ownerCompany"
                  label="Owner Company"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>

            <form.Field name="owner">
              {(field) => (
                <Input
                  id="owner"
                  label="Owner"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>
          </div>

          {/* Access fields */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <form.Field name="access">
              {(field) => (
                <Input
                  id="access"
                  label="Access"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Access instructions"
                />
              )}
            </form.Field>

            <form.Field name="accessRequested">
              {(field) => (
                <Select
                  label="Will Access Be Requested"
                  options={[
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No', label: 'No' },
                  ]}
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  placeholder="Select..."
                />
              )}
            </form.Field>
          </div>

          {/* Priority */}
          <div className="mb-6 max-w-xs">
            <form.Field
              name="priority"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'Priority is required' : undefined,
              }}
            >
              {(field) => (
                <Select
                  label="Priority *"
                  options={PRIORITIES.map((p) => ({ value: p, label: p }))}
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  placeholder="Select priority"
                />
              )}
            </form.Field>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <form.Field name="notes">
              {(field) => (
                <div>
                  <label
                    htmlFor="notes"
                    className="mb-1.5 block text-sm font-medium text-text-secondary"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border-default bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-focus focus:ring-2 focus:ring-accent-orange/20 focus:outline-none"
                    placeholder="Any additional details..."
                  />
                </div>
              )}
            </form.Field>
          </div>

          {/* Additional Comments */}
          <div className="mb-6">
            <form.Field name="additionalComments">
              {(field) => (
                <div>
                  <label
                    htmlFor="additionalComments"
                    className="mb-1.5 block text-sm font-medium text-text-secondary"
                  >
                    Additional Comments
                  </label>
                  <textarea
                    id="additionalComments"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border-default bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-focus focus:ring-2 focus:ring-accent-orange/20 focus:outline-none"
                    placeholder="Additional comments..."
                  />
                </div>
              )}
            </form.Field>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-border-default pt-6">
            <Button
              type="submit"
              disabled={form.state.isSubmitting}
            >
              {form.state.isSubmitting ? 'Submitting...' : 'Save'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate({ to: '/projects' })}
            >
              Cancel
            </Button>
          </div>
        </Card>
      </form>
    </AppLayout>
  )
}
