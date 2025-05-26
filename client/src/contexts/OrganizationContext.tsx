import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/api';

interface Organization {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  industry?: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  customRoles?: Array<{
    name: string;
    permissions: string[];
  }>;
  settings: {
    allowUserInvites: boolean;
    requireApproverReview: boolean;
  };
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrganizationState {
  currentOrg: Organization | null;
  organizations: Organization[];
  loading: boolean;
  error: string | null;
}

enum ActionType {
  SET_CURRENT_ORG = 'SET_CURRENT_ORG',
  SET_ORGANIZATIONS = 'SET_ORGANIZATIONS',
  UPDATE_ORGANIZATION = 'UPDATE_ORGANIZATION',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR'
}

type Action =
  | { type: ActionType.SET_CURRENT_ORG; payload: Organization }
  | { type: ActionType.SET_ORGANIZATIONS; payload: Organization[] }
  | { type: ActionType.UPDATE_ORGANIZATION; payload: Organization }
  | { type: ActionType.SET_LOADING; payload: boolean }
  | { type: ActionType.SET_ERROR; payload: string }
  | { type: ActionType.CLEAR_ERROR };

const initialState: OrganizationState = {
  currentOrg: null,
  organizations: [],
  loading: true,
  error: null
};

const organizationReducer = (state: OrganizationState, action: Action): OrganizationState => {
  switch (action.type) {
    case ActionType.SET_CURRENT_ORG:
      return {
        ...state,
        currentOrg: action.payload,
        error: null
      };
    case ActionType.SET_ORGANIZATIONS:
      return {
        ...state,
        organizations: action.payload,
        error: null
      };
    case ActionType.UPDATE_ORGANIZATION:
      return {
        ...state,
        organizations: state.organizations.map(org =>
          org._id === action.payload._id ? action.payload : org
        ),
        currentOrg: state.currentOrg?._id === action.payload._id
          ? action.payload
          : state.currentOrg,
        error: null
      };
    case ActionType.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case ActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case ActionType.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

interface OrganizationContextProps {
  state: OrganizationState;
  loadOrganizations: () => Promise<void>;
  setCurrentOrganization: (orgId: string) => Promise<void>;
  updateOrganization: (orgId: string, updates: Partial<Organization>) => Promise<void>;
  createOrganization: (orgData: Omit<Organization, '_id' | 'createdAt' | 'updatedAt'>) => Promise<Organization>;
}

const OrganizationContext = createContext<OrganizationContextProps>({} as OrganizationContextProps);

export const useOrganization = () => useContext(OrganizationContext);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(organizationReducer, initialState);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      dispatch({ type: ActionType.SET_LOADING, payload: true });
      const response = await api.get('/api/organizations');
      dispatch({ type: ActionType.SET_ORGANIZATIONS, payload: response.data });
      if (response.data.length > 0) {
        const currentOrgResponse = await api.get('/api/organizations/current');
        dispatch({ type: ActionType.SET_CURRENT_ORG, payload: currentOrgResponse.data });
      }
    } catch (error: any) {
      dispatch({
        type: ActionType.SET_ERROR,
        payload: error.response?.data?.message || 'Failed to load organizations'
      });
    } finally {
      dispatch({ type: ActionType.SET_LOADING, payload: false });
    }
  };

  const setCurrentOrganization = async (orgId: string) => {
    try {
      dispatch({ type: ActionType.SET_LOADING, payload: true });
      const response = await api.get(`/api/organizations/${orgId}`);
      dispatch({ type: ActionType.SET_CURRENT_ORG, payload: response.data });
    } catch (error: any) {
      dispatch({
        type: ActionType.SET_ERROR,
        payload: error.response?.data?.message || 'Failed to set current organization'
      });
    } finally {
      dispatch({ type: ActionType.SET_LOADING, payload: false });
    }
  };

  const updateOrganization = async (orgId: string, updates: Partial<Organization>) => {
    try {
      dispatch({ type: ActionType.SET_LOADING, payload: true });
      const response = await api.put(`/api/organizations/${orgId}`, updates);
      dispatch({ type: ActionType.UPDATE_ORGANIZATION, payload: response.data });
    } catch (error: any) {
      dispatch({
        type: ActionType.SET_ERROR,
        payload: error.response?.data?.message || 'Failed to update organization'
      });
      throw error;
    } finally {
      dispatch({ type: ActionType.SET_LOADING, payload: false });
    }
  };

  const createOrganization = async (orgData: Omit<Organization, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      dispatch({ type: ActionType.SET_LOADING, payload: true });
      const response = await api.post('/api/organizations', orgData);
      const newOrg = response.data;
      dispatch({
        type: ActionType.SET_ORGANIZATIONS,
        payload: [...state.organizations, newOrg]
      });
      return newOrg;
    } catch (error: any) {
      dispatch({
        type: ActionType.SET_ERROR,
        payload: error.response?.data?.message || 'Failed to create organization'
      });
      throw error;
    } finally {
      dispatch({ type: ActionType.SET_LOADING, payload: false });
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        state,
        loadOrganizations,
        setCurrentOrganization,
        updateOrganization,
        createOrganization
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
