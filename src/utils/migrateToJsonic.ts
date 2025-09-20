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
    console.log('🔍 Checking JSONIC migration status...');
    
    // Check if migration is needed (check localStorage flag)
    const migrationKey = 'jsonic_migration_completed';
    const migrationCompleted = localStorage.getItem(migrationKey);
    
    if (migrationCompleted === 'true') {
      const migrationDate = localStorage.getItem('jsonic_migration_date');
      console.log('✅ JSONIC migration already completed on:', migrationDate);
      return false;
    }
    
    console.log('📥 JSONIC migration not found, starting migration...');
    const success = await performMigration();
    
    if (success) {
      // Mark migration as complete
      localStorage.setItem(migrationKey, 'true');
      localStorage.setItem('jsonic_migration_date', new Date().toISOString());
      console.log('Migration marked as complete');
    }
    
    return success;
  } catch (error) {
    console.error('Auto-migration check failed:', error);
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