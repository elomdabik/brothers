// Quick Supabase connection test
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://naqtppdysrdjryaalbfa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cY2b9kH1IcOkNsK-KTXQrA_CIXR851B';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('=== Supabase Connection Test ===\n');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`Key: ${SUPABASE_KEY.slice(0, 20)}...`);
console.log('');

// Test 1: Products table
console.log('--- Test 1: Products table ---');
const { data: products, error: prodErr } = await supabase
  .from('products')
  .select('id, name, category, price')
  .limit(5);

if (prodErr) {
  console.log(`❌ Error: ${prodErr.message} (code: ${prodErr.code})`);
} else {
  console.log(`✅ Success! Found ${products.length} products`);
  if (products.length > 0) {
    products.forEach(p => console.log(`   - ${p.name} (${p.category}) - ${p.price}`));
  } else {
    console.log('   (table is empty)');
  }
}
console.log('');

// Test 2: Offers table
console.log('--- Test 2: Offers table ---');
const { data: offers, error: offErr } = await supabase
  .from('offers')
  .select('id, product_name, discount_percent, active')
  .limit(5);

if (offErr) {
  console.log(`❌ Error: ${offErr.message} (code: ${offErr.code})`);
} else {
  console.log(`✅ Success! Found ${offers.length} offers`);
  if (offers.length > 0) {
    offers.forEach(o => console.log(`   - ${o.product_name} (${o.discount_percent}% off, active: ${o.active})`));
  } else {
    console.log('   (table is empty)');
  }
}
console.log('');

// Test 3: Profiles table
console.log('--- Test 3: Profiles table ---');
const { data: profiles, error: profErr } = await supabase
  .from('profiles')
  .select('id, display_name, approved')
  .limit(5);

if (profErr) {
  console.log(`❌ Error: ${profErr.message} (code: ${profErr.code})`);
} else {
  console.log(`✅ Success! Found ${profiles.length} profiles`);
  if (profiles.length > 0) {
    profiles.forEach(p => console.log(`   - ${p.display_name || '(no name)'} (approved: ${p.approved})`));
  } else {
    console.log('   (table is empty)');
  }
}
console.log('');

// Test 4: Auth health check
console.log('--- Test 4: Auth service ---');
const { data: session, error: authErr } = await supabase.auth.getSession();
if (authErr) {
  console.log(`❌ Auth error: ${authErr.message}`);
} else {
  console.log(`✅ Auth service responding (session: ${session?.session ? 'active' : 'none - not logged in'})`);
}

console.log('\n=== Test Complete ===');
