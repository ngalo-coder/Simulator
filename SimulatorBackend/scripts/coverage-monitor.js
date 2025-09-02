#!/usr/bin/env node

/**
 * Test Coverage Monitoring Script
 * 
 * This script monitors test coverage and enforces minimum 80% coverage threshold.
 * It provides detailed reporting and can be integrated into CI/CD pipelines.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CoverageMonitor {
  constructor() {
    this.coverageThreshold = 80;
    this.coverageDir = pat