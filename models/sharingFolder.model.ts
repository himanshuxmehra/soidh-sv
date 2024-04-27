import pool from '../utils/db';
import logger from '../utils/logger';

interface SharingFolder {
  sharing_id: string;
  folder_id: string;
  shared_with: string;
  can_edit: boolean;
}
