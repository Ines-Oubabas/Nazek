import React, { useState, useEffect } from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import api from '../../services/api';

const LocationSelector = ({ value, onChange, error, helperText }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value?.address || '');

  useEffect(() => {
    if (inputValue.length >= 3) {
      fetchLocations();
    } else {
      setOptions([]);
    }
  }, [inputValue]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/locations/search/?query=${inputValue}`);
      setOptions(response.data);
    } catch (error) {
      console.error('Erreur lors de la recherche de localisations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value}
      onChange={(event, newValue) => onChange(newValue)}
      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
      options={options}
      loading={loading}
      getOptionLabel={(option) => option.address || ''}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      noOptionsText="Aucune localisation trouvée"
      loadingText="Chargement..."
      renderInput={(params) => (
        <TextField
          {...params}
          label="Localisation"
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <React.Fragment>
                <LocationIcon sx={{ mr: 1, color: 'action.active' }} />
                {params.InputProps.startAdornment}
              </React.Fragment>
            ),
            endAdornment: (
              <React.Fragment>
                {loading && <CircularProgress color="inherit" size={20} />}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="body1">{option.address}</Typography>
              {option.city && (
                <Typography variant="body2" color="text.secondary">
                  {option.city}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      )}
    />
  );
};

export default LocationSelector;
