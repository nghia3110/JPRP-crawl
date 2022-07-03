import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import path from 'path';
import xlsx from 'xlsx';

var DATA = [];
const workSheetColumnNames = [
    "Tên bài viết",
    "Số bài viết",
    "Doi",
    "Ngày đăng"
];
const workSheetName = 'Posts';
const filePath = 'data.xlsx';

// Hàm xử lý
const crawl = async ({ url }) => {
    const response = await fetch(url);
    const html = await response.text();

    const $ = cheerio.load(html);
    if (url.includes('article/view')) {
        const postTitle = $('.article-details > header > h2');
        const postDoi = $('.list-group-item.doi > a');
        const postDate = $('.list-group-item.date-published');
        const postNumber = $('.title');
        DATA.push({
            title: $(postTitle).text().trim(),
            number: $(postNumber).text().trim(),
            doi: $(postDoi).text().trim(),
            date: $(postDate).text().trim().substring(15)
        });
    }

    else if (url.includes('issue/view')) {
        const linksPost = $('a').map((i, link) => {
            if (link.attribs.href.includes('article/view')
                && link.attribs.role == null) {
                return link.attribs.href;
            }
        }).get();

        linksPost.forEach(link => {
            crawl({
                url: link,
            });
        })
    }

    else {
        const linksTitle = $('a').map((i, link) => {
            if (link.attribs.href.includes('issue/view')) {
                return link.attribs.href;
            }
        }).get();

        linksTitle.forEach(link => {
            crawl({
                url: link,
            });
        })
    }

    exportPostsToExcel(DATA, workSheetColumnNames, workSheetName, filePath);
};

// Hàm xuất file excel
const exportExcel = (data, workSheetColumnNames, workSheetName, filePath) => {
    const workBook = xlsx.utils.book_new();
    const workSheetData = [
        workSheetColumnNames,
        ...data
    ];
    const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
    xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName);
    xlsx.writeFile(workBook, path.resolve(filePath));
};

const exportPostsToExcel = (posts, workSheetColumnNames, workSheetName, filePath) => {
    const data = posts.map(post => {
        return [post.title, post.number, post.doi, post.date];
    });
    exportExcel(data, workSheetColumnNames, workSheetName, filePath);
};

crawl({
    url: "https://jprp.vn/index.php/JPRP/issue/archive",
});