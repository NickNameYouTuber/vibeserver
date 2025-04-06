import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Typography, TextField, Button, MenuItem, Box, FormControl, InputLabel,
  Select, Paper, CircularProgress, Stepper, Step, StepLabel, useTheme, Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CodeIcon from '@mui/icons-material/Code';
import BuildIcon from '@mui/icons-material/Build';
import SettingsIcon from '@mui/icons-material/Settings';

const MotionContainer = motion(Container);
const MotionPaper = motion(Paper);

const CreateProject = () => {
  const [formData, setFormData] = useState({
    name: '',
    template_id: '',
    settings: {},
  });
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const steps = ['Project Info', 'Template Selection', 'Settings'];

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get('http://192.168.1.99:7007/templates/');
        setTemplates(response.data);
      } catch (error) {
        console.error('Error fetching templates:', error);
        enqueueSnackbar('Failed to fetch project templates', { variant: 'error' });
      }
    };
    fetchTemplates();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSettingsChange = (settingName, value) => {
    setFormData((prev) => ({
      ...prev,
      settings: { ...prev.settings, [settingName]: value },
    }));
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplate(template);

    // Преобразуем settings_schema из объекта в массив, если он существует
    let initialSettings = {};
    if (template && template.settings_schema && typeof template.settings_schema === 'object') {
      initialSettings = Object.entries(template.settings_schema).reduce((acc, [name, config]) => {
        acc[name] = config.default !== undefined ? config.default : '';
        return acc;
      }, {});
    } else {
      console.warn('settings_schema is not an object or is undefined:', template?.settings_schema);
    }

    setFormData((prev) => ({
      ...prev,
      template_id: templateId,
      settings: initialSettings,
    }));
  };

  const getSettingsSchemaArray = (schema) => {
    if (schema && typeof schema === 'object' && !Array.isArray(schema)) {
      return Object.entries(schema).map(([name, config]) => ({
        name,
        label: name.charAt(0).toUpperCase() + name.slice(1), // Автоматическая генерация метки
        type: config.type || 'string',
        default: config.default !== undefined ? config.default : '',
      }));
    }
    return [];
  };

  const isStepComplete = (step) => {
    switch (step) {
      case 0:
        return !!formData.name.trim();
      case 1:
        return !!formData.template_id;
      case 2:
        if (selectedTemplate && selectedTemplate.settings_schema) {
          const schemaArray = getSettingsSchemaArray(selectedTemplate.settings_schema);
          return schemaArray.every(
            (field) => formData.settings[field.name] !== undefined && formData.settings[field.name] !== ''
          );
        }
        return true; // Если настроек нет, шаг считается завершенным
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepComplete(activeStep)) {
      if (activeStep === steps.length - 1) {
        handleSubmit();
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await axios.post('http://192.168.1.99:7007/projects/', formData);
      enqueueSnackbar('Project created successfully!', { variant: 'success' });
      navigate('/');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Error creating project';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <CodeIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
              <Typography variant="h6">Project Information</Typography>
            </Box>
            <TextField
              fullWidth
              label="Project Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
              autoFocus
              helperText="Choose a unique name for your project"
              InputProps={{ startAdornment: <Box component="span" sx={{ mr: 1 }}>/</Box> }}
            />
          </motion.div>
        );
      case 1:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <BuildIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
              <Typography variant="h6">Template Selection</Typography>
            </Box>
            <FormControl fullWidth margin="normal">
              <InputLabel>Project Template</InputLabel>
              <Select
                name="template_id"
                value={formData.template_id}
                onChange={handleTemplateChange}
                label="Project Template"
              >
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name} ({template.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <SettingsIcon sx={{ mr: 2, color: theme.palette.primary.main }} />
              <Typography variant="h6">Project Settings</Typography>
            </Box>
            {selectedTemplate && selectedTemplate.settings_schema ? (
              getSettingsSchemaArray(selectedTemplate.settings_schema).map((field) => (
                <TextField
                  key={field.name}
                  fullWidth
                  label={field.label}
                  name={field.name}
                  value={formData.settings[field.name] !== undefined ? formData.settings[field.name] : field.default}
                  onChange={(e) => handleSettingsChange(field.name, e.target.value)}
                  margin="normal"
                  type={field.type === 'integer' ? 'number' : field.type === 'boolean' ? 'checkbox' : 'text'}
                  helperText={`Type: ${field.type}`}
                  InputProps={field.type === 'boolean' ? { type: 'checkbox', checked: !!formData.settings[field.name] } : undefined}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No settings required for this template.
              </Typography>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <MotionContainer
      sx={{ width: '100vw', height: '100vh', p: { xs: 2, sm: 3 }, m: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        display="flex"
        alignItems="center"
        mb={4}
        component={motion.div}
        initial={{ x: -20 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        sx={{ gap: { xs: 2, sm: 2 } }}
      >
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: { xs: 2, sm: 0 } }}>
          Back
        </Button>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main, textAlign: { xs: 'center', sm: 'left' } }}
        >
          Create New Project
        </Typography>
      </Box>

      <MotionPaper
        elevation={3}
        sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, height: 'calc(100vh - 150px)', overflowY: 'auto' }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Stepper activeStep={activeStep} sx={{ mb: 4 }} orientation={window.innerWidth < 600 ? 'vertical' : 'horizontal'}>
          {steps.map((label, index) => (
            <Step key={label} completed={isStepComplete(index)}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 2 }}>
          {renderStepContent(activeStep)}

          <Divider sx={{ my: 4 }} />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              mt: 3,
              gap: { xs: 2, sm: 0 },
            }}
          >
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              fullWidth={window.innerWidth < 600}
            >
              Back
            </Button>
            <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
              <Button variant="outlined" onClick={() => navigate('/')} fullWidth={window.innerWidth < 600}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepComplete(activeStep) || isSubmitting}
                startIcon={
                  activeStep === steps.length - 1 ? (isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />) : undefined
                }
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                fullWidth={window.innerWidth < 600}
              >
                {activeStep === steps.length - 1 ? 'Create Project' : 'Next'}
              </Button>
            </Box>
          </Box>
        </Box>
      </MotionPaper>
    </MotionContainer>
  );
};

export default CreateProject;