import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

const domainMap = {
  'all': '',
  'software': 'software',
  'data': 'data science',
  'design': 'design',
  'marketing': 'marketing',
  'management': 'management'
};

async function scrapeIS(searchTerm, page) {
  try {
    const isKeyword = searchTerm ? `keywords-${encodeURIComponent(searchTerm).toLowerCase()}/` : '';
    const pageSuffix = page > 1 ? `page-${page}/` : '';
    const url = `https://internshala.com/internships/${isKeyword}${pageSuffix}`;
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    const $ = cheerio.load(data);
    const internships = [];
    $('.internship_meta').each((i, el) => {
      // Clean up text
      const title = $(el).find('.job-title-href').text().trim().replace(/\\n/g, '').replace(/\\s{2,}/g, ' ');
      const rawCompany = $(el).find('.company_name').text().trim();
      const company = rawCompany.split('\\n')[0].trim(); // Remove "Actively hiring"
      const loc = $(el).find('.loc_wap').text().trim() || 'Remote';
      
      // Clean stipend formatting
      let stipend = $(el).find('.stipend').text().trim();
      if (!stipend) stipend = 'Unpaid';
      
      const jobUrl = 'https://internshala.com' + $(el).find('.job-title-href').attr('href');
      if (title && company) {
        internships.push({ 
          id: `is-${Date.now()}-${i}`, 
          title, 
          company, 
          location: loc, 
          stipend, 
          url: jobUrl, 
          platform: 'Internshala' 
        });
      }
    });
    return internships;
  } catch (e) {
    console.error("IS Scrape Error:", e.message);
    return [];
  }
}

async function fetchUnstop(searchTerm, page) {
  try {
    const query = new URLSearchParams({
      opportunity: 'internships',
      page: page,
      per_page: 15
    });
    if (searchTerm) {
      query.append('searchTerm', searchTerm);
    }

    const url = `https://unstop.com/api/public/opportunity/search-result?${query.toString()}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    
    const arr = data?.data?.data || [];
    return arr.map((item, i) => {
      let stipend = 'Check Link';
      // Only set stipend if there's actual text
      if (item.stipend && item.stipend.stipend && item.stipend.stipend.trim() !== '') {
          stipend = item.stipend.stipend;
      }
      return {
        id: `un-${Date.now()}-${i}`,
        title: item.title,
        company: item.organization?.name || 'Unstop Partner',
        location: item.job_location && item.job_location.length > 0 ? item.job_location.join(', ') : 'Remote',
        stipend: stipend,
        url: `https://unstop.com/${item.public_url}`,
        platform: 'Unstop'
      };
    });
  } catch(e) {
    console.error("Unstop Fetch Error:", e.message);
    return [];
  }
}

router.get('/', async (req, res) => {
  const domain = req.query.domain || 'all';
  const page = parseInt(req.query.page) || 1;
  const searchTerm = domainMap[domain] !== undefined ? domainMap[domain] : domain;

  try {
    // Fetch from both in parallel
    const [isData, unData] = await Promise.all([
      scrapeIS(searchTerm, page),
      fetchUnstop(searchTerm, page)
    ]);

    // Interleave results cleanly
    const combined = [];
    const maxLen = Math.max(isData.length, unData.length);
    for (let i = 0; i < maxLen; i++) {
        if (unData[i]) combined.push(unData[i]);
        if (isData[i]) combined.push(isData[i]);
    }

    res.json(combined);
  } catch (err) {
    console.error("Error fetching internships:", err);
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

export default router;
