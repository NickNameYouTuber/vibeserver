import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Typography, Table, TableBody, TableCell, TableRow, TableHead, Button,
  CircularProgress, Box, Dialog, DialogTitle, DialogContent, Tabs, Tab, TextField,
  Paper, Chip, IconButton, Tooltip, TableContainer, Skeleton, useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { motion } from 'framer-motion';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCircleIcon from '@mui/icons-material/AddCircle';

interface Project {
  id: number;
  name: string;
  template_id: number;
  settings: Record<string, any>;
  port: number;
  status: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} {...other}>
      {value === index && (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </Box>
      )}
    </div>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'success';
    case 'stopped': return 'error';
    default: return 'default';
  }
};

const MotionContainer = motion(Container);

const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<string>('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const fetchProjects = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get('http://192.168.1.99:7007/projects/');
      setProjects(response.data);
      if (!loading) {
        enqueueSnackbar('Projects refreshed successfully', { variant: 'success' });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      enqueueSnackbar('Failed to fetch projects', { variant: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('http://192.168.1.99:7007/templates/');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchLogs = async (projectName: string) => {
    setLogsLoading(true);
    try {
      const response = await axios.get(`http://192.168.1.99:7007/projects/${projectName}/logs`);
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs('Failed to load logs');
      enqueueSnackbar('Failed to fetch logs', { variant: 'error' });
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRestart = async (projectId: number, projectName: string) => {
    try {
      enqueueSnackbar(`Restarting ${projectName}...`, { variant: 'info' });
      await axios.post(`http://192.168.1.99:7007/projects/${projectId}/restart`);
      fetchProjects();
      enqueueSnackbar(`${projectName} restarted successfully`, { variant: 'success' });
    } catch (error) {
      console.error('Error restarting project:', error);
      enqueueSnackbar(`Failed to restart ${projectName}`, { variant: 'error' });
    }
  };

  const handleStop = async (projectId: number, projectName: string) => {
    try {
      enqueueSnackbar(`Stopping ${projectName}...`, { variant: 'info' });
      await axios.post(`http://192.168.1.99:7007/projects/${projectId}/stop`);
      fetchProjects();
      enqueueSnackbar(`${projectName} stopped successfully`, { variant: 'success' });
    } catch (error) {
      console.error('Error stopping project:', error);
      enqueueSnackbar(`Failed to stop ${projectName}`, { variant: 'error' });
    }
  };

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project);
    fetchLogs(project.name);
  };

  const handleClose = () => {
    setSelectedProject(null);
    setLogs('');
    setTabValue(0);
  };

  const handleGoToProject = (projectName: string) => {
    window.open(`http://192.168.1.99/${projectName}/`, '_blank');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    fetchProjects();
    fetchTemplates();
  }, []);

  const getTemplateName = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    return template ? template.name : 'Unknown';
  };

  return (
    <MotionContainer
      sx={{ width: '100vw', height: '100vh', p: { xs: 2, sm: 3 }, m: 0 }}
      initial={{ opacityiburton: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexDirection={{ xs: 'column', sm: 'row' }}
        mb={3}
        sx={{ gap: { xs: 2, sm: 0 } }}
      >
        <Typography
          variant="h4"
          component={motion.h1}
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main, textAlign: { xs: 'center', sm: 'left' } }}
        >
          Projects Dashboard
        </Typography>
        <Box display="flex" alignItems="center" sx={{ gap: 1 }}>
          <Tooltip title="Refresh Projects">
            <IconButton onClick={fetchProjects} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            onClick={() => navigate('/create')}
            startIcon={<AddCircleIcon />}
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Create New Project
          </Button>
        </Box>
      </Box>

      <Paper
        elevation={3}
        component={motion.div}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        sx={{ overflow: 'hidden', borderRadius: 2, height: 'calc(100vh - 150px)' }}
      >
        {loading ? (
          <Box p={3}>
            <Skeleton variant="text" height={40} width="30%" sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={400} />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: '100%' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Port</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.length > 0 ? (
                  projects.map((project, index) => (
                    <TableRow
                      key={project.id}
                      hover
                      component={motion.tr}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{project.name}</TableCell>
                      <TableCell>{getTemplateName(project.template_id)}</TableCell>
                      <TableCell>
                        <Chip
                          label={project.status}
                          color={getStatusColor(project.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{project.port}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Box display="flex" sx={{ gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleOpenProject(project)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Open Project">
                            <IconButton size="small" onClick={() => handleGoToProject(project.name)}>
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Restart Project">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleRestart(project.id, project.name)}
                                disabled={project.status !== 'running'}
                                color="primary"
                              >
                                <PlayArrowIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Stop Project">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleStop(project.id, project.name)}
                                disabled={project.status === 'stopped'}
                                color="secondary"
                              >
                                <StopIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box py={4}>
                        <Typography variant="body1" color="text.secondary">
                          No projects found. Create your first project to get started.
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={() => navigate('/create')}
                          sx={{ mt: 2 }}
                          startIcon={<AddCircleIcon />}
                        >
                          Create Project
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={!!selectedProject}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={window.innerWidth < 600}
        PaperComponent={motion.div}
        PaperProps={{
          initial: { opacity: 0, y: -20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 20 },
          transition: { duration: 0.3 },
        }}
      >
        {selectedProject && (
          <>
            <DialogTitle sx={{ bgcolor: 'background.paper', borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" component="div">
                Project Details: {selectedProject.name}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 0, bgcolor: '#252525' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
              >
                <Tab label="Information" />
                <Tab label="Logs" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="ID"
                    value={selectedProject.id}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="Name"
                    value={selectedProject.name}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="Template ID"
                    value={selectedProject.template_id}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="Template Name"
                    value={getTemplateName(selectedProject.template_id)}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="Status"
                    value={selectedProject.status}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="Port"
                    value={selectedProject.port}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="Settings"
                    value={JSON.stringify(selectedProject.settings, null, 2)}
                    margin="normal"
                    multiline
                    rows={4}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {logsLoading ? (
                  <Box sx={{ p: 2 }}>
                    <CircularProgress size={24} sx={{ mr: 2 }} />
                    <Typography variant="body2" display="inline">
                      Loading logs...
                    </Typography>
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    label="Container Logs"
                    value={logs}
                    multiline
                    rows={12}
                    InputProps={{ readOnly: true, sx: { fontFamily: 'monospace' } }}
                    variant="outlined"
                  />
                )}
              </TabPanel>
            </DialogContent>
          </>
        )}
      </Dialog>
    </MotionContainer>
  );
};

export default ProjectList;