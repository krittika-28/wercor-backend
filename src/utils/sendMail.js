const Mailjet = require('node-mailjet');

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY,
  apiSecret: process.env.MAILJET_SECRET_KEY
});

const sendAgencySubmissionEmail = async (agencyData, meta = {}) => {
  const {
    name, slug, description, website, email, phone,
    address, founded_year, team_size, min_project_size,
    hourly_rate
  } = agencyData;

  try {
    const result = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_SENDER_EMAIL,
              Name: 'Wercor Agency Finder'
            },
            To: [
              {
                Email: process.env.NOTIFY_EMAIL,
                Name: 'Wercor Team'
              }
            ],
            Subject: `🚀 New Agency Submitted: ${name}`,
            HTMLPart: `
              <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto;">
                <div style="background: #0C493A; padding: 24px 30px; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 22px; color: #DCDE28;">Wercor</h1>
                  <p style="margin: 4px 0 0; font-size: 11px; letter-spacing: 2px; color: #CACFD2;">
                    NEW AGENCY SUBMISSION
                  </p>
                </div>
                
                <div style="border: 1px solid #E1E5E8; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
                  <h2 style="margin: 0 0 20px; color: #212223;">📋 ${name}</h2>
                  
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr style="border-bottom: 1px solid #E1E5E8;">
                      <td style="padding: 10px 0; font-weight: bold; color: #757F85; width: 140px;">Agency Name</td>
                      <td style="padding: 10px 0; color: #212223;">${name}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E1E5E8;">
                      <td style="padding: 10px 0; font-weight: bold; color: #757F85;">Slug</td>
                      <td style="padding: 10px 0; color: #212223;">${slug || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E1E5E8;">
                      <td style="padding: 10px 0; font-weight: bold; color: #757F85;">Website</td>
                      <td style="padding: 10px 0;">
                        ${website ? `<a href="${website}" style="color: #0C493A;">${website}</a>` : 'N/A'}
                      </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E1E5E8;">
                      <td style="padding: 10px 0; font-weight: bold; color: #757F85;">Email</td>
                      <td style="padding: 10px 0; color: #212223;">${email || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E1E5E8;">
                      <td style="padding: 10px 0; font-weight: bold; color: #757F85;">Phone</td>
                      <td style="padding: 10px 0; color: #212223;">${phone || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E1E5E8;">
                      <td style="padding: 10px 0; font-weight: bold; color: #757F85;">Address</td>
                      <td style="padding: 10px 0; color: #212223;">${address || 'N/A'}</td>
                    </tr>
                  </table>

                  <h3 style="color: #0C493A; font-size: 16px; margin: 20px 0 10px;">📍 Location & Details</h3>
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr style="border-bottom: 1px solid #E1E5E8;">
                      <td style="padding: 10px 0; font-weight: bold; color: #757F85; width: 140px;">Country</td>
                      <td style="padding: 10px 0; color: #212223;">${meta.country_name || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E1E5E8;">
                      <td style="padding: 10px 0; font-weight: bold; color: #757F85;">City</td>
                      <td style="padding: 10px 0; color: #212223;">${meta.city_name || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E1E5E8;">
                      <td style="padding: 10px 0; font-weight: bold; color: #757F85;">Continent</td>
                      <td style="padding: 10px 0; color: #212223;">${meta.continent || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E1E5E8;">
                      <td style="padding: 10px 0; font-weight: bold; color: #757F85;">Founded</td>
                      <td style="padding: 10px 0; color: #212223;">${founded_year || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E1E5E8;">
                      <td style="padding: 10px 0; font-weight: bold; color: #757F85;">Team Size</td>
                      <td style="padding: 10px 0; color: #212223;">${team_size || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E1E5E8;">
                      <td style="padding: 10px 0; font-weight: bold; color: #757F85;">Min Project</td>
                      <td style="padding: 10px 0; color: #212223;">${min_project_size || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E1E5E8;">
                      <td style="padding: 10px 0; font-weight: bold; color: #757F85;">Hourly Rate</td>
                      <td style="padding: 10px 0; color: #212223;">${hourly_rate || 'N/A'}</td>
                    </tr>
                  </table>

                  ${meta.category_names && meta.category_names.length > 0 ? `
                    <h3 style="color: #0C493A; font-size: 16px; margin: 20px 0 10px;">🏷️ Services</h3>
                    <div style="margin-bottom: 20px;">
                      ${meta.category_names.map(cat =>
                        `<span style="display: inline-block; background: #EFFFFF; color: #0C493A; padding: 4px 12px; border-radius: 20px; font-size: 13px; margin: 2px 4px 2px 0; border: 1px solid #CACFD2;">${cat}</span>`
                      ).join('')}
                    </div>
                  ` : ''}

                  <h3 style="color: #0C493A; font-size: 16px; margin: 20px 0 10px;">📝 Description</h3>
                  <div style="background: #EFFFFF; padding: 16px; border-radius: 8px; color: #212223; line-height: 1.6;">
                    ${description || 'No description provided'}
                  </div>

                  <hr style="margin: 24px 0; border: none; border-top: 1px solid #E1E5E8;" />
                  <p style="color: #757F85; font-size: 12px; margin: 0;">
                    ⏰ Submitted: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                  <p style="color: #757F85; font-size: 12px; margin: 4px 0 0;">
                    ⚠️ Status: <strong>Unverified</strong> | <strong>Not Featured</strong>
                  </p>
                </div>
              </div>
            `,
            TextPart: `New Agency Submitted: ${name}\nWebsite: ${website || 'N/A'}\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}\nCountry: ${meta.country_name || 'N/A'}\nCity: ${meta.city_name || 'N/A'}\nCategories: ${meta.category_names?.join(', ') || 'N/A'}\nDescription: ${description || 'N/A'}`
          }
        ]
      });

    console.log('✅ Mailjet email sent:', result.body.Messages[0].Status);
    return { success: true };
  } catch (error) {
    console.error('❌ Mailjet email failed:', error.statusCode, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendAgencySubmissionEmail };