package model

import (
	"bytes"
	"encoding/json"
	"fmt"
	"time"
)

// ConfigPropVal is the wire form of the stored "propVal" TEXT.
// It encodes the stored text as its decoded JSON value when the text is a
// valid JSON object or array, and as a JSON string otherwise — so a stored
// "true" or "900" never reads back as bool/number.
type ConfigPropVal string

func (v ConfigPropVal) MarshalJSON() ([]byte, error) {
	trimmed := bytes.TrimSpace([]byte(v))
	if len(trimmed) > 0 && (trimmed[0] == '{' || trimmed[0] == '[') {
		var probe any
		if err := json.Unmarshal(trimmed, &probe); err == nil {
			return trimmed, nil
		}
	}
	return json.Marshal(string(v))
}

// UnmarshalJSON accepts both wire forms (plain string, or a decoded object/
// array) and normalizes to the stored TEXT representation.
func (v *ConfigPropVal) UnmarshalJSON(data []byte) error {
	trimmed := bytes.TrimSpace(data)
	if len(trimmed) > 0 && trimmed[0] == '"' {
		var s string
		if err := json.Unmarshal(trimmed, &s); err != nil {
			return err
		}
		*v = ConfigPropVal(s)
		return nil
	}
	var probe any
	if err := json.Unmarshal(trimmed, &probe); err != nil {
		return fmt.Errorf("propVal must be a string or JSON value")
	}
	compact, err := json.Marshal(probe)
	if err != nil {
		return err
	}
	*v = ConfigPropVal(compact)
	return nil
}

// ConfigProperty mirrors public.config_properties as inspected read-only on STAGING.
// PropVal is stored TEXT: strings are kept verbatim, any other JSON value is
// stored as its compact JSON text. On the wire it is returned decoded
// (object/array) when the stored text is JSON.
type ConfigProperty struct {
	ID        int64         `json:"id" db:"id"`
	OrgID     string        `json:"orgId" db:"orgId"`
	PropKey   string        `json:"propKey" db:"propKey"`
	PropVal   ConfigPropVal `json:"propVal" db:"propVal"`
	CreatedAt *time.Time    `json:"createdAt" db:"createdAt"`
	UpdatedAt *time.Time    `json:"updatedAt" db:"updatedAt"`
	CreatedBy *string       `json:"createdBy" db:"createdBy"`
	UpdatedBy *string       `json:"updatedBy" db:"updatedBy"`
}

// ConfigPropertyListItem is the list response item. It deliberately omits
// propVal, which can hold large JSON blobs — fetch values via
// GET /config_properties/{id} or GET /config_properties/key/{propKey}.
type ConfigPropertyListItem struct {
	ID        int64      `json:"id" db:"id"`
	OrgID     string     `json:"orgId" db:"orgId"`
	PropKey   string     `json:"propKey" db:"propKey"`
	CreatedAt *time.Time `json:"createdAt" db:"createdAt"`
	UpdatedAt *time.Time `json:"updatedAt" db:"updatedAt"`
	CreatedBy *string    `json:"createdBy" db:"createdBy"`
	UpdatedBy *string    `json:"updatedBy" db:"updatedBy"`
}

// ConfigPropertyCreateRequest accepts any JSON value for propVal: a string is
// stored verbatim (backward compatible), any other JSON value is stored as its
// compact JSON text. propVal is required; explicit null is rejected.
type ConfigPropertyCreateRequest struct {
	PropKey string `json:"propKey" binding:"required"`
	PropVal any    `json:"propVal"`
}

func (r *ConfigPropertyCreateRequest) UnmarshalJSON(data []byte) error {
	type requestAlias ConfigPropertyCreateRequest
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(data, &fields); err != nil {
		return err
	}
	raw, ok := fields["propVal"]
	if !ok {
		return fmt.Errorf("propVal is required")
	}
	if bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
		return fmt.Errorf("propVal must not be null")
	}
	return json.Unmarshal(data, (*requestAlias)(r))
}

// ConfigPropertyUpdateRequest uses presence so omitted fields are unchanged.
// propVal may be any JSON value; explicit nulls are rejected because the
// columns are non-nullable.
type ConfigPropertyUpdateRequest struct {
	PropKey *string `json:"propKey"`
	PropVal any     `json:"propVal"`

	propValProvided bool
}

func (r *ConfigPropertyUpdateRequest) UnmarshalJSON(data []byte) error {
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(data, &fields); err != nil {
		return err
	}
	if raw, ok := fields["propKey"]; ok {
		if bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
			return fmt.Errorf("propKey must not be null")
		}
		var key string
		if err := json.Unmarshal(raw, &key); err != nil {
			return fmt.Errorf("propKey must be a string")
		}
		r.PropKey = &key
	}
	if raw, ok := fields["propVal"]; ok {
		if bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
			return fmt.Errorf("propVal must not be null")
		}
		var value any
		if err := json.Unmarshal(raw, &value); err != nil {
			return err
		}
		r.PropVal = value
		r.propValProvided = true
	}
	return nil
}

// HasPropVal reports whether the update body explicitly provided propVal,
// so the handler can distinguish "unchanged" from "set to <value>".
func (r *ConfigPropertyUpdateRequest) HasPropVal() bool {
	return r.propValProvided
}

// ConfigPropertySetRequest accepts any JSON value for propVal; explicit null is rejected.
type ConfigPropertySetRequest struct {
	PropVal any `json:"propVal"`
}

func (r *ConfigPropertySetRequest) UnmarshalJSON(data []byte) error {
	type requestAlias ConfigPropertySetRequest
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(data, &fields); err != nil {
		return err
	}
	raw, ok := fields["propVal"]
	if !ok {
		return fmt.Errorf("propVal is required")
	}
	if bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
		return fmt.Errorf("propVal must not be null")
	}
	return json.Unmarshal(data, (*requestAlias)(r))
}
