import { migrateJsonDataToJsonic } from '../services/jsonicApi';

export async function performMigration() {
  try {
    console.log('Starting data migration to JSONIC...');
    
    // Fetch the existing JSON data - use full path for GitHub Pages
    const basePath = import.meta.env.BASE_URL || '/';
    const dataUrl = `${basePath}data/database.json`;
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch database.json: ${response.status}`);
    }
    
    const jsonData = await response.json();
    console.log('Loaded JSON data:', {
      benchmark_runs: jsonData.benchmark_runs?.length || 0,
      model_performance: jsonData.model_performance?.length || 0,
      test_results: jsonData.test_results?.length || 0,
      performance_trends: jsonData.performance_trends?.length || 0
    });
    
    // Perform migration
    await migrateJsonDataToJsonic(jsonData);
    
    console.log('Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Auto-migration on first load
export async function checkAndMigrate() {
  try {
    console.log('🔍 Loading data into JSONIC...');
    
    // Always perform migration since JSONIC is in-memory only
    // The data doesn't persist between page loads
    console.log('📥 Loading data from JSON files...');
    const success = await performMigration();
    
    if (success) {
      console.log('✅ Data loaded successfully into JSONIC');
    }
    
    return success;
  } catch (error) {
    console.error('Failed to load data into JSONIC:', error);
    return false;
  }
}

// Manual migration trigger
export async function resetAndMigrate() {
  // Clear migration flag
  localStorage.removeItem('jsonic_migration_completed');
  localStorage.removeItem('jsonic_migration_date');
  
  // Perform migration
  return await checkAndMigrate();
}