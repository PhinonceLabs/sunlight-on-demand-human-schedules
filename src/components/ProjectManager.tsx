import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Folder, Plus, Save, Trash2, Building, Lightbulb, User, Calendar } from 'lucide-react';
import { LightingSchedule } from '../utils/lightingStandards';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string;
  client: string;
  location: string;
  projectType: 'office' | 'healthcare' | 'education' | 'residential' | 'retail' | 'hospitality' | 'custom';
  schedule: LightingSchedule;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

interface ProjectManagerProps {
  currentSchedule: LightingSchedule | null;
  onLoadProject: (project: Project) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  currentSchedule,
  onLoadProject
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    client: '',
    location: '',
    projectType: 'office' as Project['projectType'],
    tags: ''
  });
  const { toast } = useToast();

  // Load projects from localStorage on component mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('lightingProjects');
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        const projectsWithDates = parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }));
        setProjects(projectsWithDates);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    }
  }, []);

  // Save projects to localStorage whenever projects change
  useEffect(() => {
    localStorage.setItem('lightingProjects', JSON.stringify(projects));
  }, [projects]);

  const createProject = () => {
    if (!currentSchedule) {
      toast({
        title: "No Schedule Available",
        description: "Please generate a lighting schedule first.",
        variant: "destructive"
      });
      return;
    }

    if (!newProject.name.trim()) {
      toast({
        title: "Project Name Required",
        description: "Please enter a project name.",
        variant: "destructive"
      });
      return;
    }

    const project: Project = {
      id: crypto.randomUUID(),
      name: newProject.name,
      description: newProject.description,
      client: newProject.client,
      location: newProject.location,
      projectType: newProject.projectType,
      schedule: currentSchedule,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: newProject.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    };

    setProjects(prev => [project, ...prev]);
    setIsCreating(false);
    setNewProject({
      name: '',
      description: '',
      client: '',
      location: '',
      projectType: 'office',
      tags: ''
    });

    toast({
      title: "Project Created",
      description: `"${project.name}" has been saved successfully.`
    });
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    toast({
      title: "Project Deleted",
      description: "Project has been removed from your library."
    });
  };

  const loadProject = (project: Project) => {
    onLoadProject(project);
    toast({
      title: "Project Loaded",
      description: `"${project.name}" has been loaded successfully.`
    });
  };

  const updateCurrentProject = () => {
    if (!currentSchedule) {
      toast({
        title: "No Schedule Available",
        description: "Please generate a lighting schedule first.",
        variant: "destructive"
      });
      return;
    }

    // For now, we'll create a quick save - in a real app this would update existing project
    const quickSave: Project = {
      id: crypto.randomUUID(),
      name: `Quick Save - ${format(new Date(), 'MMM dd, HH:mm')}`,
      description: 'Auto-saved lighting schedule',
      client: '',
      location: '',
      projectType: 'custom',
      schedule: currentSchedule,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['quick-save']
    };

    setProjects(prev => [quickSave, ...prev]);
    toast({
      title: "Schedule Saved",
      description: "Current schedule has been saved as a quick save."
    });
  };

  const getProjectTypeIcon = (type: Project['projectType']) => {
    switch (type) {
      case 'office':
        return <Building className="h-4 w-4" />;
      case 'healthcare':
        return <Plus className="h-4 w-4" />;
      case 'education':
        return <User className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getProjectTypeColor = (type: Project['projectType']) => {
    switch (type) {
      case 'office':
        return 'bg-blue-100 text-blue-800';
      case 'healthcare':
        return 'bg-green-100 text-green-800';
      case 'education':
        return 'bg-purple-100 text-purple-800';
      case 'residential':
        return 'bg-orange-100 text-orange-800';
      case 'retail':
        return 'bg-pink-100 text-pink-800';
      case 'hospitality':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Folder className="h-5 w-5 mr-2" />
            Project Library
          </CardTitle>
          <CardDescription>
            Manage your lighting design projects and schedules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsCreating(true)}
              disabled={!currentSchedule}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
            <Button 
              onClick={updateCurrentProject}
              disabled={!currentSchedule}
              variant="outline"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Quick Save
            </Button>
          </div>

          {isCreating && (
            <Card className="border-dashed">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Create New Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name *</Label>
                    <Input
                      id="project-name"
                      value={newProject.name}
                      onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Office Building Renovation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-client">Client</Label>
                    <Input
                      id="project-client"
                      value={newProject.client}
                      onChange={(e) => setNewProject(prev => ({ ...prev, client: e.target.value }))}
                      placeholder="ABC Corporation"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-location">Location</Label>
                    <Input
                      id="project-location"
                      value={newProject.location}
                      onChange={(e) => setNewProject(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="New York, NY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-type">Project Type</Label>
                    <select
                      id="project-type"
                      value={newProject.projectType}
                      onChange={(e) => setNewProject(prev => ({ ...prev, projectType: e.target.value as Project['projectType'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="office">Office</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="education">Education</option>
                      <option value="residential">Residential</option>
                      <option value="retail">Retail</option>
                      <option value="hospitality">Hospitality</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the lighting requirements..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-tags">Tags (comma-separated)</Label>
                  <Input
                    id="project-tags"
                    value={newProject.tags}
                    onChange={(e) => setNewProject(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="circadian, wellness, energy-efficient"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={createProject}>Create Project</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No projects yet. Create your first lighting design project!</p>
              </div>
            ) : (
              projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{project.name}</h3>
                          <Badge variant="secondary" className={getProjectTypeColor(project.projectType)}>
                            {getProjectTypeIcon(project.projectType)}
                            <span className="ml-1 capitalize">{project.projectType}</span>
                          </Badge>
                        </div>
                        
                        {project.description && (
                          <p className="text-sm text-gray-600">{project.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {project.client && (
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {project.client}
                            </span>
                          )}
                          {project.location && (
                            <span>{project.location}</span>
                          )}
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(project.updatedAt, 'MMM dd, yyyy')}
                          </span>
                        </div>

                        {project.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {project.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => loadProject(project)}>
                          Load
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => deleteProject(project.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectManager;