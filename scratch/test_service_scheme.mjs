async function testServiceScheme() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@investrow.in', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status, loginData.user?.email);

    const cookie = loginRes.headers.get('set-cookie');
    if (!cookie) {
      console.error('No auth cookie returned');
      return;
    }

    // 2. Fetch clients to get one
    const clientsRes = await fetch('http://localhost:3000/api/leads?limit=5', {
      headers: { 'Cookie': cookie }
    });
    const clientsData = await clientsRes.json();
    const client = clientsData.leads?.[0];
    if (!client) {
      console.error('No client found');
      return;
    }
    console.log('Found client:', client.name, client._id, 'Current schemes:', client.schemes?.length || 0);

    // 3. Add Life Insurance Scheme
    const newLifeInsurance = {
      service: 'Life Insurance',
      schemeName: 'HDFC Life Sanchay Plus',
      provider: 'HDFC Life',
      policyNumber: 'POL-8912345',
      investmentType: 'Annual',
      sipAmount: 0,
      investmentAmount: 50000,
      sumAssured: 5000000,
      premiumFrequency: 'Annual',
      tenureYears: 15,
      status: 'Active',
      remarks: 'Test policy for automated verification'
    };

    const updatedSchemes = [...(client.schemes || []), newLifeInsurance];

    const putRes = await fetch(`http://localhost:3000/api/leads/${client._id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify({ schemes: updatedSchemes })
    });

    const putData = await putRes.json();
    console.log('PUT lead response status:', putRes.status, 'Body:', putData);

    // 4. Verify GET
    const getRes = await fetch(`http://localhost:3000/api/leads/${client._id}`, {
      headers: { 'Cookie': cookie }
    });
    const getData = await getRes.json();
    const fetchedSchemes = getData.lead?.schemes || [];
    console.log('Total schemes now:', fetchedSchemes.length);
    const added = fetchedSchemes.find(s => s.policyNumber === 'POL-8912345');
    console.log('Found added insurance policy:', added ? {
      service: added.service,
      schemeName: added.schemeName,
      provider: added.provider,
      policyNumber: added.policyNumber,
      sumAssured: added.sumAssured,
      investmentAmount: added.investmentAmount,
      premiumFrequency: added.premiumFrequency
    } : 'NOT FOUND');

    if (added && added.provider === 'HDFC Life' && added.sumAssured === 5000000) {
      console.log('SUCCESS: Service scheme persistence verified!');
    } else {
      console.error('FAILURE: Scheme details did not match expected values');
    }

  } catch (err) {
    console.error('Test error:', err);
  }
}

testServiceScheme();
