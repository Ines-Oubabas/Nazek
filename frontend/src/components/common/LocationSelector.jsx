import React, { useState, useEffect } from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import api from '../../services/api';

const LocationSelector = ({ value, onChange, error, helperText }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

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

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
  };

  const handleChange = (event, newValue) => {
    onChange(newValue);
  };

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value}
      onChange={handleChange}
      onInputChange={handleInputChange}
      options={options}
      loading={loading}
      getOptionLabel={(option) => option.address || ''}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Localisation"
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                <LocationIcon color="action" />
              </Box>
            ),
            endAdornment: (
              <React.Fragment>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <LocationIcon sx={{ mr: 1, color: 'action' }} />
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
      noOptionsText="Aucune localisation trouvée"
      loadingText="Chargement..."
      isOptionEqualToValue={(option, value) => option.id === value.id}
    />
  );
};

export default LocationSelector; 