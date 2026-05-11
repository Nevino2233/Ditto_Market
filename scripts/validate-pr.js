const fs = require('fs');
const path = require('path');

const APPS_DIR = path.join(__dirname, '..', 'apps');
const DATA_DIR = path.join(__dirname, '..', 'data');

const REQUIRED_MANIFEST_FIELDS = ['id', 'name', 'version', 'description', 'icon', 'entry', 'category'];
const REQUIRED_MARKET_FIELDS = ['summary', 'description', 'category', 'tags', 'publisher', 'downloadUrl'];
const VALID_CATEGORIES = ['productivity', 'social', 'entertainment', 'development', 'theme', 'widget', 'plugin', 'education', 'utility'];

let errors = [];
let warnings = [];

function validateManifest(appDir) {
  const manifestPath = path.join(appDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    errors.push(`Missing manifest.json in ${appDir}`);
    return null;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    errors.push(`Invalid JSON in ${manifestPath}: ${e.message}`);
    return null;
  }

  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!manifest[field]) {
      errors.push(`Missing required field "${field}" in ${manifestPath}`);
    }
  }

  if (manifest.id && !/^([a-z0-9]+\.){2,}[a-z0-9]+$/.test(manifest.id)) {
    warnings.push(`App ID "${manifest.id}" should be in reverse-domain format (e.g. com.example.myapp)`);
  }

  if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
    warnings.push(`Version "${manifest.version}" should follow semver (e.g. 1.0.0)`);
  }

  if (manifest.market) {
    for (const field of REQUIRED_MARKET_FIELDS) {
      if (!manifest.market[field]) {
        errors.push(`Missing required market field "${field}" in ${manifestPath}`);
      }
    }

    if (manifest.market.category && !VALID_CATEGORIES.includes(manifest.market.category)) {
      warnings.push(`Unknown category "${manifest.market.category}" in ${manifestPath}. Valid: ${VALID_CATEGORIES.join(', ')}`);
    }

    if (manifest.market.downloadUrl && !manifest.market.downloadUrl.includes('github.com')) {
      errors.push(`downloadUrl must point to github.com in ${manifestPath}`);
    }

    if (manifest.market.screenshots && manifest.market.screenshots.length > 8) {
      warnings.push(`Too many screenshots (${manifest.market.screenshots.length}) in ${manifestPath}. Maximum 8.`);
    }
  } else {
    warnings.push(`No "market" field in ${manifestPath}. Market metadata is recommended.`);
  }

  if (manifest.permissions) {
    const validPermissions = ['storage', 'network', 'clipboard', 'notification', 'geolocation', 'camera', 'microphone'];
    for (const perm of manifest.permissions) {
      if (!validPermissions.includes(perm)) {
        warnings.push(`Unknown permission "${perm}" in ${manifestPath}. Valid: ${validPermissions.join(', ')}`);
      }
    }
    const sensitivePerms = ['camera', 'microphone', 'geolocation'];
    for (const perm of sensitivePerms) {
      if (manifest.permissions.includes(perm)) {
        warnings.push(`Sensitive permission "${perm}" requested in ${manifestPath}. Requires extra review.`);
      }
    }
  }

  return manifest;
}

function validateReviews(appId) {
  const reviewPath = path.join(DATA_DIR, 'reviews', `${appId}.json`);
  if (!fs.existsSync(reviewPath)) return;

  let reviews;
  try {
    reviews = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
  } catch (e) {
    errors.push(`Invalid JSON in ${reviewPath}: ${e.message}`);
    return;
  }

  if (!Array.isArray(reviews)) {
    errors.push(`Reviews file ${reviewPath} must be an array`);
    return;
  }

  const userIds = new Set();
  for (const review of reviews) {
    if (!review.userId || !review.rating || !review.createdAt) {
      errors.push(`Invalid review in ${reviewPath}: missing required fields`);
    }
    if (review.rating < 1 || review.rating > 5) {
      errors.push(`Invalid rating ${review.rating} in ${reviewPath}: must be 1-5`);
    }
    if (userIds.has(review.userId)) {
      errors.push(`Duplicate review by ${review.userId} in ${reviewPath}`);
    }
    userIds.add(review.userId);
  }
}

function main() {
  console.log('🔍 Validating Ditto Market PR...\n');

  if (!fs.existsSync(APPS_DIR)) {
    errors.push('Apps directory not found');
  } else {
    const appDirs = fs.readdirSync(APPS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    if (appDirs.length === 0) {
      warnings.push('No apps found in apps/ directory');
    }

    for (const appDir of appDirs) {
      const fullPath = path.join(APPS_DIR, appDir);
      const manifest = validateManifest(fullPath);
      if (manifest) {
        validateReviews(manifest.id ?? appDir);
      }
    }
  }

  const categoriesPath = path.join(DATA_DIR, 'categories.json');
  if (fs.existsSync(categoriesPath)) {
    try {
      JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    } catch (e) {
      errors.push(`Invalid categories.json: ${e.message}`);
    }
  }

  const featuredPath = path.join(DATA_DIR, 'featured.json');
  if (fs.existsSync(featuredPath)) {
    try {
      JSON.parse(fs.readFileSync(featuredPath, 'utf8'));
    } catch (e) {
      errors.push(`Invalid featured.json: ${e.message}`);
    }
  }

  console.log(`\n📋 Results:`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(e => console.log(`   - ${e}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (errors.length === 0) {
    console.log('\n✅ Validation passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Validation failed!');
    process.exit(1);
  }
}

main();
