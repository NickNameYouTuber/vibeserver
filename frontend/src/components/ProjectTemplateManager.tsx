import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Typography, Button, Table, TableBody, TableCell, TableRow, TableHead,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  Box, IconButton, Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const ProjectTemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAIDialog, setOpenAIDialog] = useState(false);
  const [description, setDescription] = useState('');
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    settings_schema: [],
    files: {},
  });
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('http://192.168.1.99:7007/templates/');
      setTemplates(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке шаблонов:', error);
      enqueueSnackbar('Не удалось загрузить шаблоны', { variant: 'error' });
    }
  };

  const handleCreate = () => {
    setCurrentTemplate(null);
    setFormData({
      name: '',
      type: '',
      settings_schema: [],
      files: {},
    });
    setOpenDialog(true);
  };

  const handleEdit = (template) => {
    let settingsArray = [];
    if (template.settings_schema && !Array.isArray(template.settings_schema)) {
      settingsArray = Object.entries(template.settings_schema).map(([key, value]) => ({
        name: key,
        label: key,
        type: value.type,
        default: value.default,
      }));
    } else if (Array.isArray(template.settings_schema)) {
      settingsArray = template.settings_schema;
    }

    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      settings_schema: settingsArray,
      files: template.files || {},
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://192.168.1.99:7007/templates/${id}`);
      enqueueSnackbar('Шаблон успешно удалён', { variant: 'success' });
      fetchTemplates();
    } catch (error) {
      console.error('Ошибка при удалении шаблона:', error);
      enqueueSnackbar('Не удалось удалить шаблон', { variant: 'error' });
    }
  };

  const handleSubmit = async () => {
    try {
      const processedSettingsSchema = formData.settings_schema.reduce((acc, setting) => {
        acc[setting.name] = {
          type: setting.type,
          default: setting.default,
          label: setting.label,
        };
        return acc;
      }, {});
      const payload = { ...formData, settings_schema: processedSettingsSchema };

      if (currentTemplate) {
        await axios.put(`http://192.168.1.99:7007/templates/${currentTemplate.id}`, payload);
        enqueueSnackbar('Шаблон успешно обновлён', { variant: 'success' });
      } else {
        await axios.post('http://192.168.1.99:7007/templates/', payload);
        enqueueSnackbar('Шаблон успешно создан', { variant: 'success' });
      }
      setOpenDialog(false);
      fetchTemplates();
    } catch (error) {
      console.error('Ошибка при сохранении шаблона:', error);
      enqueueSnackbar('Не удалось сохранить шаблон', { variant: 'error' });
    }
  };

  const handleAIGenerate = async () => {
    try {
      await axios.post('http://192.168.1.99:7007/templates/ai-generate', { description });
      enqueueSnackbar('Шаблон успешно создан с помощью ИИ', { variant: 'success' });
      setOpenAIDialog(false);
      setDescription('');
      fetchTemplates();
    } catch (error) {
      console.error('Ошибка при создании шаблона с помощью ИИ:', error);
      enqueueSnackbar('Не удалось создать шаблон с помощью ИИ', { variant: 'error' });
    }
  };

  const addSetting = () => {
    setFormData({
      ...formData,
      settings_schema: [
        ...formData.settings_schema,
        { name: '', label: '', type: 'string', default: '' },
      ],
    });
  };

  const removeSetting = (index) => {
    const newSettings = formData.settings_schema.filter((_, i) => i !== index);
    setFormData({ ...formData, settings_schema: newSettings });
  };

  const handleSettingChange = (index, key, value) => {
    const newSettings = [...formData.settings_schema];
    newSettings[index][key] = value;
    setFormData({ ...formData, settings_schema: newSettings });
  };

  const addFile = () => {
    setFormData({
      ...formData,
      files: { ...formData.files, '': '' },
    });
  };

  const removeFile = (fileName) => {
    const newFiles = { ...formData.files };
    delete newFiles[fileName];
    setFormData({ ...formData, files: newFiles });
  };

  const handleFileChange = (oldName, newName, content) => {
    const newFiles = { ...formData.files };
    if (oldName !== newName) {
      delete newFiles[oldName];
    }
    newFiles[newName] = content;
    setFormData({ ...formData, files: newFiles });
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Управление шаблонами проектов
      </Typography>
      <Button variant="contained" onClick={handleCreate} sx={{ mb: 2 }}>
        Создать новый шаблон
      </Button>
      <Button variant="contained" onClick={() => setOpenAIDialog(true)} sx={{ mb: 2, ml: 2 }}>
        Создать с помощью ИИ
      </Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Название</TableCell>
            <TableCell>Тип</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>{template.name}</TableCell>
              <TableCell>{template.type}</TableCell>
              <TableCell>
                <Tooltip title="Редактировать">
                  <IconButton onClick={() => handleEdit(template)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton onClick={() => handleDelete(template.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{currentTemplate ? 'Редактировать шаблон' : 'Создать шаблон'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Тип"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            margin="normal"
            required
          />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Настройки по умолчанию
          </Typography>
          {formData.settings_schema.map((field, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                label="Имя"
                value={field.name}
                onChange={(e) => handleSettingChange(index, 'name', e.target.value)}
                size="small"
                required
              />
              <TextField
                label="Метка"
                value={field.label}
                onChange={(e) => handleSettingChange(index, 'label', e.target.value)}
                size="small"
                required
              />
              <Select
                value={field.type}
                onChange={(e) => handleSettingChange(index, 'type', e.target.value)}
                size="small"
              >
                <MenuItem value="string">Строка</MenuItem>
                <MenuItem value="integer">Целое число</MenuItem>
                <MenuItem value="boolean">Логическое</MenuItem>
              </Select>
              <TextField
                label="Значение по умолчанию"
                value={field.default}
                onChange={(e) => handleSettingChange(index, 'default', e.target.value)}
                size="small"
              />
              <Button onClick={() => removeSetting(index)}>Удалить</Button>
            </Box>
          ))}
          <Button onClick={addSetting} sx={{ mt: 1 }}>
            Добавить настройку
          </Button>

          <Typography variant="h6" sx={{ mt: 2 }}>
            Файлы шаблона
          </Typography>
          {Object.entries(formData.files).map(([fileName, content], index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                label="Имя файла"
                value={fileName}
                onChange={(e) => handleFileChange(fileName, e.target.value, content)}
                size="small"
                required
              />
              <TextField
                label="Содержимое"
                value={content}
                onChange={(e) => handleFileChange(fileName, fileName, e.target.value)}
                size="small"
                multiline
                rows={4}
                sx={{ flexGrow: 1 }}
              />
              <Button onClick={() => removeFile(fileName)}>Удалить</Button>
            </Box>
          ))}
          <Button onClick={addFile} sx={{ mt: 1 }}>
            Добавить файл
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
          <Button onClick={handleSubmit}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAIDialog} onClose={() => setOpenAIDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать шаблон с помощью ИИ</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Описание проекта"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            required
            multiline
            rows={4}
            placeholder="Например: 'простое веб-приложение на Flask'"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAIDialog(false)}>Отмена</Button>
          <Button onClick={handleAIGenerate}>Создать</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectTemplateManager;